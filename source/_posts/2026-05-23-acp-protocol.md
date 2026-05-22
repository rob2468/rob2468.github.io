---
layout: post
title: ACP (Agent Communication Protocol) 概念梳理
tags:
  - AI
---

# {{ page.title }}

## ACP 解决什么问题

Claude Code、Codex 这些 AI coding agent 各有自己的私有内核。如果你想在自己的应用里程序化地驱动它们（比如发一条 prompt、拿到流式回复、审批工具调用），每家 agent 的对接方式都不一样，你得为每家写一套集成代码。

ACP（Agent Communication Protocol）就是为了解决这个问题——定义一套统一的协议，让任何 client 都能用同一种方式对接任何 agent。一个协议，多个 agent 实现，多个 client 实现，互相可以对接。

<!-- more -->

## 整体架构

```
┌─────────────┐         ┌──────────────────┐         ┌───────────────────────┐
│  你的应用    │  ACP协议  │  ACP Adapter      │  内部调用  │  Agent 内核            │
│ (ACP Client)│ ◄──────► │ (协议翻译层)       │ ◄───────► │ (Claude Code / Codex) │
└─────────────┘  stdio   └──────────────────┘          └───────────────────────┘
```

三个角色：

- **Agent 内核**：Claude Code CLI、Codex CLI，各家厂商的私有实现，只能在终端里人机交互。
- **ACP Adapter**：包装 agent 内核，对外暴露标准 ACP 接口。是一个独立的可执行进程。
- **ACP Client**：你的应用。spawn adapter 进程，通过标准协议与之通信。

通信方式是：client spawn adapter 进程后，通过进程的 stdin/stdout 收发 JSON 格式的消息。

## 以 LSP 类比

ACP 的设计思路完全参考了 LSP（Language Server Protocol）：

```
LSP 生态                          ACP 生态
─────────                         ─────────
LSP 协议规范                       ACP 协议规范
TypeScript Language Server        claude-agent-acp (Claude Code adapter)
Rust Analyzer                     codex-acp (Codex adapter)
VS Code (client)                  Zed 编辑器 (client)
Neovim (client)                   自建应用 (client)
```

LSP 让任何编辑器对接任何语言服务器，ACP 让任何客户端对接任何 AI agent。协议由 Zed Industries（Zed 编辑器的公司）主导推出。

## 协议本身：JSON-RPC over stdio

ACP 协议的传输方式是 JSON-RPC over stdio，即：

- **传输通道**用 stdio：client 往 adapter 进程的 stdin 写消息，从 stdout 读消息。每条消息占一行，`\n` 分隔。不需要开端口，不需要 HTTP，进程退出即断开。
- **消息格式**用 JSON-RPC：一个通用的远程过程调用格式。

```jsonc
// client → agent 请求
{"jsonrpc": "2.0", "id": 1, "method": "session/prompt", "params": {...}}

// agent → client 响应
{"jsonrpc": "2.0", "id": 1, "result": {...}}

// agent → client 通知（无 id，无需回复）
{"jsonrpc": "2.0", "method": "session/update", "params": {...}}
```

ACP 在这个基础上定义了具体的方法集——`session/new` 创建会话、`session/prompt` 发送用户消息、`session/update` 流式返回回复、`session/cancel` 中断执行、`fs/read_text_file` agent 请求 client 读文件、`terminal/create` agent 请求 client 执行命令等等。

## ACP Adapter

Agent 内核（Claude Code CLI、Codex CLI）本身不直接暴露 ACP 接口，需要一个 adapter 层来桥接：

```
Claude Code CLI (agent 内核)
       ↑ adapter 内部调用
claude-agent-acp (ACP adapter 进程)
       ↑ 标准 ACP 协议 (JSON-RPC over stdio)
你的应用 (ACP client)
```

adapter 是独立的 npm 包，需要单独安装：

| Agent | ACP adapter 包 | 安装后的可执行文件 |
|-------|----------------|-------------------|
| Claude Code | `@agentclientprotocol/claude-agent-acp` | `claude-agent-acp` |
| Codex | `@agentclientprotocol/codex-acp` | `codex-acp` |

```bash
npm install -g @agentclientprotocol/claude-agent-acp
npm install -g @agentclientprotocol/codex-acp
```

adapter 由 ACP 协议社区做适配，不是各家 agent 厂商自己发布。但 adapter 底层会依赖各家厂商的官方 SDK/二进制来驱动 agent 内核。

## ACP Client 端实现

client 端不需要依赖任何 ACP 三方库。协议就是 JSON-RPC over stdio，用 Node.js 内置模块即可实现：

```typescript
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

// spawn adapter 进程
const proc = spawn('claude-agent-acp', [], {
  cwd: '/path/to/workspace',
  stdio: ['pipe', 'pipe', 'pipe'],
});

// 从 stdout 逐行读取消息
const rl = createInterface({ input: proc.stdout });
rl.on('line', (line) => {
  const message = JSON.parse(line);
  // 处理响应或通知...
});

// 往 stdin 写入请求
function request(method, params) {
  const message = { jsonrpc: '2.0', id: nextId++, method, params };
  proc.stdin.write(JSON.stringify(message) + '\n');
}

// 典型调用流程
request('initialize', { protocolVersion: 1, clientInfo: { name: 'MyApp' } });
request('session/new', { cwd: '/path/to/workspace' });
request('session/prompt', { sessionId: '...', blocks: [{ type: 'text', text: '帮我分析这个项目' }] });
```

## 与 Claude Agent SDK 的关系

之前的博客写过 [Claude Agent SDK](/2026/03/26/claude-agent-sdk/)（`@anthropic-ai/claude-agent-sdk`），它和 ACP 是两种不同的对接 Claude Code 的方式：

| | Claude Agent SDK | ACP |
|---|---|---|
| 对接方式 | 直接 import SDK 包在 Node.js 里调用 | spawn adapter 进程通过 stdio 通信 |
| 支持的 agent | 仅 Claude Code | Claude Code、Codex、以及未来任何实现 ACP 的 agent |
| 协议标准 | Anthropic 私有 | 开放标准 |
| 适用场景 | 只需对接 Claude 的简单场景 | 需要统一对接多种 agent 的场景 |

ACP 的优势在于一套 client 实现就能对接所有支持 ACP 的 agent，不需要为每家写不同的集成代码。

## 参考文档

- ACP 官网：[https://agentclientprotocol.com](https://agentclientprotocol.com)
- ACP 协议概览：[https://agentclientprotocol.com/protocol/overview.md](https://agentclientprotocol.com/protocol/overview.md)
- ACP 架构说明：[https://agentclientprotocol.com/get-started/architecture.md](https://agentclientprotocol.com/get-started/architecture.md)
- ACP 入门介绍：[https://agentclientprotocol.com/get-started/introduction.md](https://agentclientprotocol.com/get-started/introduction.md)
