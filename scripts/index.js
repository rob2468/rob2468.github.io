const { encodeURL } = require('hexo-util');

hexo.extend.filter.register('marked:renderer', function(renderer) {
  const { config } = this; // Skip this line if you don't need user config from _config.yml

  // 重写 hexo-renderer-marked 处理图片的方式
  renderer.image = function(href, title, text) {
    const { hexo, options } = this;
    const { relative_link } = hexo.config;
    const { lazyload, prependRoot, postPath } = options;

    if (!/^(#|\/\/|http(s)?:)/.test(href) && !relative_link && prependRoot) {
      if (!href.startsWith('/') && !href.startsWith('\\') && postPath) {
        const PostAsset = hexo.model('PostAsset');
        // findById requires forward slash
        const asset = PostAsset.findById(join(postPath, href.replace(/\\/g, '/')));
        // asset.path is backward slash in Windows
        if (asset) href = asset.path.replace(/\\/g, '/');
      }
      href = url_for.call(hexo, href);
    }

    let out = '';
    const argv = process.argv;
    if (argv[argv.length - 1] === 'server' || argv[argv.length - 1] === '--draft') {
      // 本地运行
      out += `<img src="${encodeURL(href)}"`;
    } else {
      // 因为图片放在了 lfs，默认地址无法访问，需要修改
      out += `<img src="https://media.githubusercontent.com/media/rob2468/rob2468.github.io/master${encodeURL(href)}"`;
    }

    if (text) out += ` alt="${text}"`;
    if (title) out += ` title="${title}"`;
    if (lazyload) out += ' loading="lazy"';

    out += '>';
    return out;
  }
})
