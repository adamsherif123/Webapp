// src/utils/menu.js

export function initMenuToggle() {
    const menu = document.querySelector('#mobile-menu');
    const menuLinks = document.querySelector('.navbar__menu');
  
    if (menu && menuLinks) {
      menu.addEventListener('click', () => {
        menu.classList.toggle('is-active');
        menuLinks.classList.toggle('active');
      });
    }
  }
  