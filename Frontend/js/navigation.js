/**
 * NxLife Zoom Booking System
 * App Navigation
 */

const Navigation = (function () {

  let initialized =
    false;


  let currentView =
    'home';


  const elements =
    {};


  function init() {

    if (initialized) {
      return;
    }


    elements.appScreen =
      document.getElementById(
        'appScreen'
      );


    elements.homeView =
      document.getElementById(
        'homeView'
      );


    elements.myBookingsView =
      document.getElementById(
        'myBookingsView'
      );


    elements.adminRecurringView =
      document.getElementById(
        'adminRecurringView'
      );


    elements.adminUsersView =
      document.getElementById(
        'adminUsersView'
      );


    elements.homeButton =
      document.getElementById(
        'navHomeButton'
      );


    elements.myBookingsButton =
      document.getElementById(
        'navMyBookingsButton'
      );


    elements.adminRecurringButton =
      document.getElementById(
        'navAdminRecurringButton'
      );


    elements.adminUsersButton =
      document.getElementById(
        'navAdminUsersButton'
      );


    elements.homeButton
      .addEventListener(
        'click',
        showHome_
      );


    elements.myBookingsButton
      .addEventListener(
        'click',
        showMyBookings_
      );


    elements.adminRecurringButton
      .addEventListener(
        'click',
        showAdminRecurring_
      );


    elements.adminUsersButton
      .addEventListener(
        'click',
        showAdminUsers_
      );


    /*
     * app.js controls appScreen visibility.
     */
    const observer =
      new MutationObserver(
        syncAppState_
      );


    observer.observe(
      elements.appScreen,
      {

        attributes:
          true,

        attributeFilter:
          ['class']

      }
    );


    syncAppState_();


    initialized =
      true;

  }


  function syncAppState_() {

    const isVisible =
      !elements.appScreen
        .classList
        .contains(
          'hidden'
        );


    if (!isVisible) {

      currentView =
        'home';

      return;

    }


    const user =
      Auth.getCurrentUser();


    const isAdmin =
      user &&
      String(
        user.role || ''
      )
        .toLowerCase() ===
      'admin';


    /*
     * Admin-only menus.
     */
    elements.adminRecurringButton
      .classList
      .toggle(
        'hidden',
        !isAdmin
      );


    elements.adminUsersButton
      .classList
      .toggle(
        'hidden',
        !isAdmin
      );


    /*
     * Every login starts at Home.
     */
    showHome_();

  }


  /* =======================================================
     HOME
  ======================================================= */


  function showHome_() {

    currentView =
      'home';


    hideAllViews_();


    elements.homeView
      .classList
      .remove(
        'hidden'
      );


    setActiveButton_(
      elements.homeButton
    );


    requestAnimationFrame(
      function() {

        window.dispatchEvent(
          new Event(
            'resize'
          )
        );

      }
    );

  }


  /* =======================================================
     MY BOOKING
  ======================================================= */


  async function showMyBookings_() {

    const user =
      Auth.getCurrentUser();


    if (!user) {
      return;
    }


    currentView =
      'myBookings';


    hideAllViews_();


    elements.myBookingsView
      .classList
      .remove(
        'hidden'
      );


    setActiveButton_(
      elements.myBookingsButton
    );


    await MyBookings.open(
      user
    );

  }


  /* =======================================================
     ADMIN RECURRING
  ======================================================= */


  async function showAdminRecurring_() {

    const user =
      Auth.getCurrentUser();


    if (
      !user ||
      String(
        user.role || ''
      )
        .toLowerCase() !==
      'admin'
    ) {

      return;

    }


    currentView =
      'adminRecurring';


    hideAllViews_();


    elements.adminRecurringView
      .classList
      .remove(
        'hidden'
      );


    setActiveButton_(
      elements.adminRecurringButton
    );


    await AdminRecurring.open(
      user
    );

  }


  /* =======================================================
     ADMIN USERS
  ======================================================= */


  async function showAdminUsers_() {

    const user =
      Auth.getCurrentUser();


    if (
      !user ||
      String(
        user.role || ''
      )
        .toLowerCase() !==
      'admin'
    ) {

      return;

    }


    currentView =
      'adminUsers';


    hideAllViews_();


    elements.adminUsersView
      .classList
      .remove(
        'hidden'
      );


    setActiveButton_(
      elements.adminUsersButton
    );


    await AdminUsers.open(
      user
    );

  }


  /* =======================================================
     HELPERS
  ======================================================= */


  function hideAllViews_() {

    elements.homeView
      .classList
      .add(
        'hidden'
      );


    elements.myBookingsView
      .classList
      .add(
        'hidden'
      );


    elements.adminRecurringView
      .classList
      .add(
        'hidden'
      );


    elements.adminUsersView
      .classList
      .add(
        'hidden'
      );

  }


  function setActiveButton_(
    activeButton
  ) {

    [

      elements.homeButton,
      elements.myBookingsButton,
      elements.adminRecurringButton,
      elements.adminUsersButton

    ].forEach(
      function(button) {

        button.classList.toggle(
          'active',
          button ===
            activeButton
        );

      }
    );

  }


  return {

    init

  };

})();


document.addEventListener(
  'DOMContentLoaded',
  Navigation.init
);