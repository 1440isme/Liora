(function ($) {
  'use strict';

  function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  $(function () {
    $('[data-bs-toggle="offcanvas"]').on("click", throttle(function () {
      $('.sidebar-offcanvas').toggleClass('active');
    }, 300));


    $('[data-bs-toggle="minimize"]').on("click", throttle(function () {
      $('body').toggleClass('sidebar-icon-only');
    }, 300));
  });
})(jQuery);