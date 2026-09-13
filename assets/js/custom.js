window.BLOG_CONFIG = {
  homeBanner: {
    src: "random",
    alt: "首頁橫幅的替代文字",
    credit: "圖片來源：[マンガUP! - 灰宮先輩は怖くてかわいい](https://www.manga-up.com/titles/1626)" /* 👈 新增這一行，填寫你的出處 */
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('a');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetUrl = link.getAttribute('href');
      const isBlank = link.getAttribute('target') === '_blank';
      const isAnchor = targetUrl && targetUrl.startsWith('#');
      const isSameDomain = link.hostname === window.location.hostname;

      // 觸發條件：站內連結 + 非頁面內跳轉 + 非另開視窗
      if (targetUrl && isSameDomain && !isAnchor && !isBlank) {
        e.preventDefault(); 
        document.body.classList.add('is-leaving');
        
        setTimeout(() => {
          window.location.href = link.href;
        }, 400); // 等待 CSS 淡出動畫結束
      }
    });
  });
});

// 解決瀏覽器「上一頁」快取導致畫面卡在黑屏的問題
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    document.body.classList.remove('is-leaving');
  }
});