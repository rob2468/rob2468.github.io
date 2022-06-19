---
layout: post
title: 二叉树的遍历，伪代码实现
page_id: id-2018-09-16
---

<h1>{{ page.title }}</h1>

<pre><code>/**
 *  二叉树链表存储，结点数据模型
 */
struct BiTreeNode {
    int data;
    BiTreeNode *lchild;
    BiTreeNode *rchild;
};
</code></pre>

<!-- more -->

<h3>递归算法</h3>

<pre><code>/**
 *  先序遍历二叉树，递归算法实现
 *  采用链表存储结构，对每个二叉树的结点数据调用 Visit 函数
 *  最简单的 Visit 函数功能之一，如打印传入参数
 */
void PreOrderTraverse(BiTreeNode *T) {
    if (T) {
        Visit(T->data);
        PreOrderTraverse(T->lchild);
        PreOrderTraverse(T->rchild);
    }
}
</code></pre>

<pre><code>/**
 *  中序遍历二叉树，递归算法实现
 */
void InOrderTraverse(BiTreeNode *T) {
    if (T) {
        InOrderTraverse(T->lchild);
        Visit(T->data);
        InOrderTraverse(T->rchild);
    }
}
</code></pre>

<pre><code>/**
 *  后序遍历二叉树，递归算法实现
 */
void PostOrderTraverse(BiTreeNode *T) {
    if (T) {
        PostOrderTraverse(T->lchild);
        PostOrderTraverse(T->rchild);
        Visit(T->data);
    }
}
</code></pre>

<h3>非递归算法</h3>

<pre><code>/**
 *  先序遍历二叉树，非递归算法实现
 */
void PreOrderTraverse(BiTreeNode *T) {
    stack<BiTreeNode *> s;
    BiTreeNode *p = T;
    while (p || !s.empty()) {
        if (p) {
            Visit(p->data);
            s.push(p);
            p = p->lchild;
        } else {
            p = s.top();
            s.pop();
            p = p->rchild;
        }
     }
 }
</code></pre>

<pre><code>/**
 *  中序遍历二叉树，非递归算法实现
 */
void InOrderTraverse(BiTreeNode *T) {
    stack<BiTreeNode *> s;
    BiTreeNode *p = T;
    while (p || !s.empty()) {
        if (p) {
            s.push(p);
            p = p->lchild;
        } else {
            p = s.top();
            s.pop();
            Visit(p->data);
            p = p->rchild;
        }
    }
}
</code></pre>

<pre><code>/**
 *  后续遍历二叉树，非递归算法实现
 *  当用栈来存储结点，必须分清返回根结点时，是从左子树返回的，还是从右子树返回的
 *  使用辅助指针 r，其指向最近访问过的结点（也可以在结点中增加一个标志域，记录是否已被访问）
 */
void PostOrderTraverse(BiTreeNode *T) {
    stack<BiTreeNode *> s;
    BiTreeNode *p = T, *r = NULL;
    while (p || !s.empty()) {
        if (p) {
            // 走到最左边
            s.push(p);
            p = p->lchild;
        } else {
            // 向右
            p = s.top();            // 取栈顶结点
            if (p->rchild && p->rchild != r) {
                // 右子树存在，且未被访问过
                p = p->rchild;      // 转向右
                s.push(p);          // 压入栈
                p = p->lchild;      // 再走到最左
            } else {
                // 弹出结点并访问
                p = s.top();
                s.pop();            // 将结点弹出
                Visit(p->data);     // 访问该结点
                r = p;              // 记录最近访问过的结点
                p = NULL;           // 结点访问完后，重置 p 指针
            }
        } // else
    } // while
}
</code></pre>

<h3>参考文献：</h3>

严蔚敏, 吴伟民. 数据结构(C语言版). 清华大学出版社.

王道论坛. 程序员求职宝典. 电子工业出版社.
