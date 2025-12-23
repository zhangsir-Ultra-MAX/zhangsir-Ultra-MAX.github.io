function f(e,l,n=!1){let t=null;return function(...o){const u=()=>{t=null,n||e(...o)},c=n&&!t;t&&clearTimeout(t),t=setTimeout(u,l),c&&e(...o)}}export{f as d};
//# sourceMappingURL=debounce-CLGozXK5.js.map
