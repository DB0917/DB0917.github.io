document.addEventListener('DOMContentLoaded', () => {
  // 取得網頁中所有的連結 (a 標籤)
  const links = document.querySelectorAll('a');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetUrl = link.getAttribute('href');
      const isBlank = link.getAttribute('target') === '_blank'; // 是否另開視窗
      const isAnchor = targetUrl && targetUrl.startsWith('#');  // 是否為頁內錨點 (#about)
      const isSameDomain = link.hostname === window.location.hostname; // 是否為站內連結

      // 只有「站內連結」且「不是頁面內跳轉」、「不是另開視窗」時，才觸發過場動畫
      if (targetUrl && isSameDomain && !isAnchor && !isBlank) {
        e.preventDefault(); // 先阻止瀏覽器的預設瞬間跳轉
        
        // 替 body 加上 .is-leaving class 來觸發 CSS 淡出動畫
        document.body.classList.add('is-leaving');
        
        // 等待 400 毫秒（配合 CSS 動畫的時間），然後真正跳轉
        setTimeout(() => {
          window.location.href = link.href;
        }, 400);
      }
    });
  });
});

// 修正：當使用者按瀏覽器的「上一頁」返回時，解除 is-leaving 狀態，否則畫面會卡在全黑淡出狀態
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    document.body.classList.remove('is-leaving');
  }
});

window.BLOG_CONFIG = {
  homeBanner: {
    src: "assets/images/haimiya.jpg",
    alt: "首頁橫幅的替代文字"
  }
};