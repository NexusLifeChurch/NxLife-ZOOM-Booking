/**
 * NxLife Zoom Booking System
 * Admin User Management
 */

const AdminUsers = (function () {

  let initialized =
    false;


  let currentAdmin =
    null;


  let users =
    [];

  let dataLoaded =
    false;
    
  let editingUser =
    null;


  const elements =
    {};


  function init() {

    if (initialized) {
      return;
    }


    cacheElements_();

    bindEvents_();


    initialized =
      true;

  }


  function cacheElements_() {

    elements.loading =
      document.getElementById(
        'adminUsersLoading'
      );


    elements.error =
      document.getElementById(
        'adminUsersError'
      );


    elements.empty =
      document.getElementById(
        'adminUsersEmpty'
      );


    elements.list =
      document.getElementById(
        'adminUserList'
      );
    elements.count =
      document.getElementById(
        'adminUserCount'
      );

    elements.addButton =
      document.getElementById(
        'adminAddUserButton'
      );


    elements.modal =
      document.getElementById(
        'adminUserModal'
      );


    elements.modalTitle =
      document.getElementById(
        'adminUserModalTitle'
      );


    elements.modalDescription =
      document.getElementById(
        'adminUserModalDescription'
      );


    elements.closeButton =
      document.getElementById(
        'adminUserModalClose'
      );


    elements.cancelButton =
      document.getElementById(
        'adminUserCancel'
      );


    elements.form =
      document.getElementById(
        'adminUserForm'
      );


    elements.userLogin =
      document.getElementById(
        'adminUserLogin'
      );


    elements.userName =
      document.getElementById(
        'adminUserName'
      );


    elements.otp =
      document.getElementById(
        'adminUserOtp'
      );


    elements.role =
      document.getElementById(
        'adminUserRole'
      );


    elements.active =
      document.getElementById(
        'adminUserActive'
      );


    elements.message =
      document.getElementById(
        'adminUserMessage'
      );


    elements.saveButton =
      document.getElementById(
        'adminUserSave'
      );

  }


  function bindEvents_() {

    elements.addButton
      .addEventListener(
        'click',
        openCreateModal_
      );


    elements.closeButton
      .addEventListener(
        'click',
        closeModal_
      );


    elements.cancelButton
      .addEventListener(
        'click',
        closeModal_
      );


    elements.modal
      .addEventListener(
        'click',
        function(event) {

          if (
            event.target ===
            elements.modal
          ) {

            closeModal_();

          }

        }
      );


    elements.form
      .addEventListener(
        'submit',
        handleSubmit_
      );


    document.addEventListener(
      'keydown',
      function(event) {

        if (
          event.key ===
            'Escape' &&
          !elements.modal
            .classList
            .contains(
              'hidden'
            )
        ) {

          closeModal_();

        }

      }
    );

  }


  /**
   * Open Admin Users view.
   */
async function open(
  user
) {

  init();


  currentAdmin =
    user ||
    Auth.getCurrentUser();


  if (
    !currentAdmin ||
    String(
      currentAdmin.role || ''
    ).toLowerCase() !==
      'admin'
  ) {

    showError_(
      'เมนูนี้สำหรับ Admin เท่านั้น'
    );

    return;

  }


  /*
   * First visit:
   * Load from Backend.
   *
   * Later visits:
   * Render browser memory immediately.
   */
  if (!dataLoaded) {

    await loadUsers_();

    return;

  }


  renderUsers_();

}


  /**
   * Load User Sheet.
   */
  async function loadUsers_() {

    showLoading_();


    try {

      const result =
        await API.getUsersAdmin(
          getCurrentAdminId_()
        );


          users =
            Array.isArray(
              result.users
            )
              ? result.users
              : [];


          dataLoaded =
            true;


          renderUsers_();


    } catch (error) {

      console.error(
        error
      );


      showError_(
        error.message ||
        'ไม่สามารถโหลดรายชื่อผู้ใช้งานได้'
      );

    }

  }


function renderUsers_() {

  hideStatus_();


  elements.list.innerHTML =
    '';


  elements.count.textContent =
    users.length;


  if (
    users.length ===
    0
  ) {

    elements.empty
      .classList
      .remove(
        'hidden'
      );

    return;

  }


  /*
   * Group order:
   * Admin first, User second.
   */
  const groups = [

    {
      role:
        'Admin',

      title:
        'ADMIN'
    },

    {
      role:
        'User',

      title:
        'USER'
    }

  ];


  groups.forEach(
    function (group) {

      const groupUsers =
        users
          .filter(
            function (user) {

              return (
                normalize_(
                  user.role
                ) ===
                normalize_(
                  group.role
                )
              );

            }
          );


      if (
        groupUsers.length ===
        0
      ) {

        return;

      }


      const sortedUsers =
        sortUsersForGroup_(
          groupUsers
        );


      elements.list.appendChild(
        createUserGroup_(
          group.title,
          group.role,
          sortedUsers
        )
      );

    }
  );

}


function createUserRow_(
  user
) {

  const row =
    document.createElement(
      'article'
    );


  row.className =
    'admin-user-group-item';


  if (
    !isUserActive_(
      user
    )
  ) {

    row.classList.add(
      'inactive'
    );

  }


  /* =====================================
     TOP LINE
     UserName + Actions
  ===================================== */

  const topLine =
    document.createElement(
      'div'
    );


  topLine.className =
    'admin-user-item-topline';


  const name =
    document.createElement(
      'strong'
    );


  name.className =
    'admin-user-item-name';


  name.textContent =
    user.userName ||
    '-';


  const actions =
    document.createElement(
      'div'
    );


  actions.className =
    'admin-user-icon-actions';


  const editButton =
    createUserActionButton_(
      'edit'
    );


  editButton.addEventListener(
    'click',
    function () {

      openEditModal_(
        user
      );

    }
  );


  const deleteButton =
    createUserActionButton_(
      'delete'
    );


  const isSelf =
    normalize_(
      user.userLogin
    ) ===
    normalize_(
      getCurrentAdminId_()
    );


  deleteButton.disabled =
    isSelf;


  if (isSelf) {

    deleteButton.title =
      'ไม่สามารถลบบัญชีที่กำลังใช้งานอยู่';

  }


  deleteButton.addEventListener(
    'click',
    function () {

      handleDelete_(
        user
      );

    }
  );


  actions.appendChild(
    editButton
  );


  actions.appendChild(
    deleteButton
  );


  topLine.appendChild(
    name
  );


  topLine.appendChild(
    actions
  );


  /* =====================================
     META
  ===================================== */

  const meta =
    document.createElement(
      'div'
    );


  meta.className =
    'admin-user-item-meta';


  const login =
    document.createElement(
      'span'
    );


  login.innerHTML =
    '<small>UserID</small>' +
    escapeHtml_(
      user.userLogin ||
      '-'
    );


  const otp =
    document.createElement(
      'span'
    );


  otp.innerHTML =
    '<small>OTP</small>' +
    escapeHtml_(
      user.otp ||
      '----'
    );


  meta.appendChild(
    login
  );


  meta.appendChild(
    otp
  );


  /* =====================================
     BADGES
  ===================================== */

  const badges =
    document.createElement(
      'div'
    );


  badges.className =
    'admin-user-item-badges';


  const role =
    document.createElement(
      'span'
    );


  role.className =
    'admin-role-badge ' +
    (
      user.role ===
      'Admin'
        ? 'admin'
        : 'user'
    );


  role.textContent =
    user.role ||
    'User';


  const active =
    document.createElement(
      'span'
    );


  active.className =
    'admin-active-badge ' +
    (
      isUserActive_(
        user
      )
        ? 'active'
        : 'inactive'
    );


  active.textContent =
    isUserActive_(
      user
    )
      ? 'Active'
      : 'Inactive';


  badges.appendChild(
    role
  );


  badges.appendChild(
    active
  );


  row.appendChild(
    topLine
  );


  row.appendChild(
    meta
  );


  row.appendChild(
    badges
  );


  return row;

}
/* =======================================================
   USER GROUP VIEW
======================================================= */


/**
 * Create one Role group.
 *
 * Example:
 * ADMIN
 * USER
 */
function createUserGroup_(
  title,
  role,
  groupUsers
) {

  const group =
    document.createElement(
      'section'
    );


  group.className =
    'admin-user-group-card ' +
    normalize_(
      role
    );


  /*
   * GROUP HEADER
   */
  const header =
    document.createElement(
      'div'
    );


  header.className =
    'admin-user-group-header';


  const heading =
    document.createElement(
      'h2'
    );


  heading.className =
    'admin-user-group-title';


  heading.textContent =
    title;


  const count =
    document.createElement(
      'span'
    );


  count.className =
    'admin-user-group-count';


  count.textContent =
    groupUsers.length +
    ' รายการ';


  header.appendChild(
    heading
  );


  header.appendChild(
    count
  );


  /*
   * GROUP ITEMS
   */
  const items =
    document.createElement(
      'div'
    );


  items.className =
    'admin-user-group-items';


  let inactiveDividerAdded =
    false;


  groupUsers.forEach(
    function (user) {

      if (
        !isUserActive_(user) &&
        !inactiveDividerAdded
      ) {

        const divider =
          document.createElement(
            'div'
          );


        divider.className =
          'admin-user-inactive-divider';


        divider.textContent =
          'ไม่ได้ใช้งาน';


        items.appendChild(
          divider
        );


        inactiveDividerAdded =
          true;

      }


      items.appendChild(
        createUserRow_(
          user
        )
      );

    }
  );


  group.appendChild(
    header
  );


  group.appendChild(
    items
  );


  return group;

}


/**
 * Active users first.
 * Inactive users stay at
 * the bottom of THEIR role group.
 */
function sortUsersForGroup_(
  list
) {

  return list
    .slice()
    .sort(
      function (a, b) {

        const activeA =
          isUserActive_(
            a
          );


        const activeB =
          isUserActive_(
            b
          );


        if (
          activeA !==
          activeB
        ) {

          return activeA
            ? -1
            : 1;

        }


        const nameCompare =
          String(
            a.userName || ''
          )
            .localeCompare(
              String(
                b.userName || ''
              ),
              'th'
            );


        if (
          nameCompare !==
          0
        ) {

          return nameCompare;

        }


        return String(
          a.userLogin || ''
        )
          .localeCompare(
            String(
              b.userLogin || ''
            )
          );

      }
    );

}


/**
 * Normalize Active value.
 */
function isUserActive_(
  user
) {

  if (
    user.active ===
    true
  ) {

    return true;

  }


  return (
    String(
      user.active || ''
    )
      .trim()
      .toLowerCase() ===
    'true'
  );

}


/**
 * Icon-only action button.
 */
function createUserActionButton_(
  type
) {

  const button =
    document.createElement(
      'button'
    );


  button.type =
    'button';


  button.className =
    'admin-user-icon-action ' +
    type;


  let label =
    '';


  let svg =
    '';


  if (
    type ===
    'edit'
  ) {

    label =
      'แก้ไข';


    svg =
      `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M4 20l4.2-1 10-10a2.2 2.2 0 0 0-3.1-3.1l-10 10L4 20z"></path>
        <path d="M13.8 7.2l3 3"></path>
      </svg>
      `;

  }


  if (
    type ===
    'delete'
  ) {

    label =
      'ลบ';


    svg =
      `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M4 7h16"></path>
        <path d="M9 7V4h6v3"></path>
        <path d="M7 7l1 13h8l1-13"></path>
        <path d="M10 11v5M14 11v5"></path>
      </svg>
      `;

  }


  button.innerHTML =
    svg;


  button.title =
    label;


  button.setAttribute(
    'aria-label',
    label
  );


  return button;

}


/**
 * Safe text used inside small
 * generated HTML fragments.
 */
function escapeHtml_(
  value
) {

  return String(
    value || ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}

  /* =======================================================
     CREATE
  ======================================================= */


  function openCreateModal_() {

    editingUser =
      null;


    elements.form.reset();


    elements.modalTitle.textContent =
      'เพิ่มผู้ใช้งาน';


    elements.modalDescription.textContent =
      'กำหนด UserID และ OTP ให้ผู้ใช้สำหรับการเข้าใช้งานครั้งแรก';


    elements.userLogin.disabled =
      false;


    elements.role.value =
      'User';


    elements.active.checked =
      true;


    clearModalMessage_();


    openModal_();


    setTimeout(
      function() {

        elements.userLogin.focus();

      },
      50
    );

  }


  /* =======================================================
     EDIT
  ======================================================= */


  function openEditModal_(
    user
  ) {

    editingUser =
      user;


    elements.modalTitle.textContent =
      'แก้ไขผู้ใช้งาน';


    elements.modalDescription.textContent =
      'สามารถแก้ OTP ได้โดยตรงเมื่อผู้ใช้ต้องการตั้ง PIN ใหม่';


    elements.userLogin.value =
      user.userLogin;


    elements.userName.value =
      user.userName;


    elements.otp.value =
      user.otp;


    elements.role.value =
      user.role;


    elements.active.checked =
      Boolean(
        user.active
      );


    const isSelf =
      normalize_(
        user.userLogin
      ) ===
      normalize_(
        getCurrentAdminId_()
      );


    /*
     * Prevent active Admin from
     * changing own UserID.
     */
    elements.userLogin.disabled =
      isSelf;


    clearModalMessage_();


    openModal_();

  }


  /* =======================================================
     SAVE
  ======================================================= */


  async function handleSubmit_(
    event
  ) {

    event.preventDefault();


    clearModalMessage_();


    const userLogin =
      elements.userLogin.value.trim();


    const userName =
      elements.userName.value.trim();


    const otp =
      elements.otp.value.trim();


    const role =
      elements.role.value;


    const active =
      elements.active.checked;


    if (!userLogin) {

      showModalMessage_(
        'กรุณาระบุ UserID'
      );

      return;

    }


    if (!userName) {

      showModalMessage_(
        'กรุณาระบุชื่อผู้ใช้งาน'
      );

      return;

    }


    if (
      !/^[1-9][0-9]{3}$/
        .test(
          otp
        )
    ) {

      showModalMessage_(
        'OTP ต้องเป็นตัวเลข 4 หลัก ตั้งแต่ 1000 ถึง 9999'
      );

      return;

    }


    setSaving_(
      true
    );


    try {

      if (editingUser) {

        await API.updateUserAdmin({

          userId:
            getCurrentAdminId_(),

          originalUserLogin:
            editingUser.userLogin,

          userLogin:
            userLogin,

          userName:
            userName,

          otp:
            otp,

          role:
            role,

          active:
            active

        });


        showToast_(
          'แก้ไขข้อมูลผู้ใช้งานแล้ว',
          'success'
        );


      } else {

        await API.createUserAdmin({

          userId:
            getCurrentAdminId_(),

          userLogin:
            userLogin,

          userName:
            userName,

          otp:
            otp,

          role:
            role,

          active:
            active

        });


        showToast_(
          'เพิ่มผู้ใช้งานแล้ว',
          'success'
        );

      }


      setSaving_(
        false
      );


      closeModal_();


      await loadUsers_();


    } catch (error) {

      console.error(
        error
      );


      showModalMessage_(
        error.message ||
        'ไม่สามารถบันทึกข้อมูลได้'
      );


      setSaving_(
        false
      );

    }

  }


  /* =======================================================
     DELETE
  ======================================================= */


  async function handleDelete_(
    user
  ) {

    const accepted =
      window.confirm(
        'ต้องการลบผู้ใช้งาน "' +
        user.userName +
        '" ใช่หรือไม่?'
      );


    if (!accepted) {
      return;
    }


    try {

      await API.deleteUserAdmin(
        getCurrentAdminId_(),
        user.userLogin
      );


      showToast_(
        'ลบผู้ใช้งานแล้ว',
        'success'
      );


      await loadUsers_();


    } catch (error) {

      console.error(
        error
      );


      showToast_(
        error.message ||
        'ไม่สามารถลบผู้ใช้งานได้',
        'error'
      );

    }

  }


  /* =======================================================
     MODAL
  ======================================================= */


  function openModal_() {

    elements.modal
      .classList
      .remove(
        'hidden'
      );


    elements.modal.setAttribute(
      'aria-hidden',
      'false'
    );


    document.body
      .classList
      .add(
        'modal-open'
      );

  }


  function closeModal_() {

    if (
      elements.saveButton.disabled
    ) {

      return;

    }


    elements.modal
      .classList
      .add(
        'hidden'
      );


    elements.modal.setAttribute(
      'aria-hidden',
      'true'
    );


    document.body
      .classList
      .remove(
        'modal-open'
      );


    editingUser =
      null;

  }


  function setSaving_(
    saving
  ) {

    elements.saveButton.disabled =
      saving;


    elements.cancelButton.disabled =
      saving;


    elements.closeButton.disabled =
      saving;


    elements.saveButton.textContent =
      saving
        ? 'กำลังบันทึก...'
        : 'บันทึก';

  }


  function showModalMessage_(
    message
  ) {

    elements.message.textContent =
      message;


    elements.message
      .classList
      .remove(
        'hidden'
      );

  }


  function clearModalMessage_() {

    elements.message.textContent =
      '';


    elements.message
      .classList
      .add(
        'hidden'
      );

  }


  /* =======================================================
     STATUS
  ======================================================= */


  function showLoading_() {

    elements.loading
      .classList
      .remove(
        'hidden'
      );


    elements.error
      .classList
      .add(
        'hidden'
      );


    elements.empty
      .classList
      .add(
        'hidden'
      );


    elements.list.innerHTML =
      '';

  }


  function hideStatus_() {

    elements.loading
      .classList
      .add(
        'hidden'
      );


    elements.error
      .classList
      .add(
        'hidden'
      );


    elements.empty
      .classList
      .add(
        'hidden'
      );

  }


  function showError_(
    message
  ) {

    elements.loading
      .classList
      .add(
        'hidden'
      );


    elements.empty
      .classList
      .add(
        'hidden'
      );


    elements.error.textContent =
      message;


    elements.error
      .classList
      .remove(
        'hidden'
      );

  }


  /* =======================================================
     HELPERS
  ======================================================= */


  function getCurrentAdminId_() {

    return (
      currentAdmin.userId ||
      currentAdmin.userLogin ||
      ''
    );

  }


  function normalize_(
    value
  ) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase();

  }


  function showToast_(
    message,
    type
  ) {

    const toast =
      document.getElementById(
        'toast'
      );


    if (!toast) {
      return;
    }


    toast.textContent =
      message;


    toast.className =
      'toast ' +
      (
        type ||
        'info'
      );


    setTimeout(
      function() {

        toast.classList.add(
          'hidden'
        );

      },
      3200
    );

  }


  return {

    init,
    open,
    reload:
      loadUsers_

  };

})();


document.addEventListener(
  'DOMContentLoaded',
  AdminUsers.init
);