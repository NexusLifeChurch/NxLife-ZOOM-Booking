/**
 * NxLife Zoom Booking System
 * Admin Recurring Management
 *
 * Admin only:
 * - Read
 * - Create
 * - Update
 * - Pause / Activate
 * - Delete
 */

const AdminRecurring = (function () {

  const DAY_ORDER = [
    'จันทร์',
    'อังคาร',
    'พุธ',
    'พฤหัสบดี',
    'ศุกร์',
    'เสาร์',
    'อาทิตย์'
  ];


  let initialized =
    false;


  let currentAdmin =
    null;


  let recurring =
    [];

    let dataLoaded =
    false;

  let editingItem =
    null;

  let viewMode =
    'day';

  const elements =
    {};


  /* =======================================================
     INIT
  ======================================================= */


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
        'adminRecurringLoading'
      );


    elements.error =
      document.getElementById(
        'adminRecurringError'
      );


    elements.empty =
      document.getElementById(
        'adminRecurringEmpty'
      );


    elements.list =
      document.getElementById(
        'adminRecurringList'
      );


    elements.count =
      document.getElementById(
        'adminRecurringCount'
      );


    elements.addButton =
      document.getElementById(
        'adminRecurringAddButton'
      );
    elements.groupDayButton =
      document.getElementById(
        'adminRecurringGroupDayButton'
      );


    elements.groupRoomButton =
      document.getElementById(
        'adminRecurringGroupRoomButton'
      );

    /*
     * Modal
     */
    elements.modal =
      document.getElementById(
        'adminRecurringModal'
      );


    elements.modalTitle =
      document.getElementById(
        'adminRecurringModalTitle'
      );


    elements.modalDescription =
      document.getElementById(
        'adminRecurringModalDescription'
      );


    elements.closeButton =
      document.getElementById(
        'adminRecurringModalClose'
      );


    elements.form =
      document.getElementById(
        'adminRecurringForm'
      );


    elements.activity =
      document.getElementById(
        'adminRecurringActivity'
      );


    elements.room =
      document.getElementById(
        'adminRecurringRoom'
      );


    elements.dayOfWeek =
      document.getElementById(
        'adminRecurringDayOfWeek'
      );


    elements.startDate =
      document.getElementById(
        'adminRecurringStartDate'
      );


    elements.endDate =
      document.getElementById(
        'adminRecurringEndDate'
      );


    elements.startTime =
      document.getElementById(
        'adminRecurringStartTime'
      );


    elements.endTime =
      document.getElementById(
        'adminRecurringEndTime'
      );


    elements.active =
      document.getElementById(
        'adminRecurringActive'
      );


    elements.message =
      document.getElementById(
        'adminRecurringMessage'
      );


    elements.cancelButton =
      document.getElementById(
        'adminRecurringCancel'
      );


    elements.saveButton =
      document.getElementById(
        'adminRecurringSave'
      );

  }


  function bindEvents_() {

    elements.addButton
      .addEventListener(
        'click',
        openCreateModal_
      );

    elements.groupDayButton
      .addEventListener(
        'click',
        function () {

          setViewMode_(
            'day'
          );

        }
      );


    elements.groupRoomButton
      .addEventListener(
        'click',
        function () {

          setViewMode_(
            'room'
          );

        }
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


    elements.form
      .addEventListener(
        'submit',
        handleSubmit_
      );


    elements.startTime
      .addEventListener(
        'change',
        function () {

          populateEndTimes_(
            elements.startTime.value,
            ''
          );

        }
      );


    elements.modal
      .addEventListener(
        'click',
        function (event) {

          if (
            event.target ===
            elements.modal
          ) {

            closeModal_();

          }

        }
      );


    document.addEventListener(
      'keydown',
      function (event) {

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


  /* =======================================================
     OPEN VIEW
  ======================================================= */


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
    )
      .trim()
      .toLowerCase() !==
    'admin'
  ) {

    showError_(
      'เมนูนี้สำหรับ Admin เท่านั้น'
    );

    return;

  }


  try {

    /*
     * DataStore.initialize()
     * ถ้าเคยโหลดแล้ว จะใช้ Memory เดิม
     * ไม่ยิง Backend ซ้ำ
     */
    await DataStore.initialize();


    /*
     * เปิดหน้า Recurring ครั้งแรก
     * โหลด Admin Recurring จาก Backend
     */
    if (!dataLoaded) {

      showLoading_();

      await loadRecurring_();

      return;

    }


    /*
     * ครั้งต่อไปใช้ข้อมูลใน Memory
     * ไม่โหลด Backend ใหม่
     */
    render_();


  } catch (error) {

    console.error(
      error
    );


    showError_(
      error.message ||
      'ไม่สามารถโหลดกิจกรรมประจำได้'
    );

  }

}


  /* =======================================================
     LOAD
  ======================================================= */


async function loadRecurring_() {

  const result =
    await API.getRecurringAdmin(
      getCurrentAdminId_()
    );


  recurring =
    Array.isArray(
      result.recurring
    )
      ? result.recurring
      : [];


  dataLoaded =
    true;


  sortRecurring_();

  render_();

}


  function sortRecurring_() {

    recurring.sort(
      function (a, b) {

        /*
         * Active first
         */
        if (
          a.active !==
          b.active
        ) {

          return a.active
            ? -1
            : 1;

        }


        const dayA =
          DAY_ORDER.indexOf(
            a.dayOfWeek
          );


        const dayB =
          DAY_ORDER.indexOf(
            b.dayOfWeek
          );


        if (
          dayA !==
          dayB
        ) {

          return (
            dayA - dayB
          );

        }


        return (
          timeToMinutes_(
            a.startTime
          ) -
          timeToMinutes_(
            b.startTime
          )
        );

      }
    );

  }


  /* =======================================================
     RENDER
  ======================================================= */


  function render_() {

  hideStatus_();


  elements.list.innerHTML =
    '';


  elements.count.textContent =
    recurring.length;


  updateViewModeButtons_();


  if (
    recurring.length ===
    0
  ) {

    elements.empty
      .classList
      .remove(
        'hidden'
      );

    return;

  }


  const groups =
    buildGroups_();


  groups.forEach(
    function (group) {

      elements.list.appendChild(
        createGroupCard_(
          group
        )
      );

    }
  );

}
/* =======================================================
   GROUP VIEW
======================================================= */


/**
 * Switch view only in browser memory.
 * No Backend request.
 */
function setViewMode_(
  mode
) {

  if (
    mode !== 'day' &&
    mode !== 'room'
  ) {

    return;

  }


  viewMode =
    mode;


  render_();

}


/**
 * Active state of view buttons.
 */
function updateViewModeButtons_() {

  elements.groupDayButton
    .classList
    .toggle(
      'active',
      viewMode ===
        'day'
    );


  elements.groupRoomButton
    .classList
    .toggle(
      'active',
      viewMode ===
        'room'
    );

}


/**
 * Build display groups.
 *
 * DAY:
 * Monday -> Sunday
 *
 * ROOM:
 * ZoomRoom order -> unknown rooms
 */
function buildGroups_() {

  if (
    viewMode ===
    'room'
  ) {

    return buildRoomGroups_();

  }


  return buildDayGroups_();

}


/**
 * Group by DayOfWeek.
 */
function buildDayGroups_() {

  const groups =
    [];


  DAY_ORDER.forEach(
    function (day) {

      const items =
        recurring.filter(
          function (item) {

            return (
              item.dayOfWeek ===
              day
            );

          }
        );


      if (
        items.length ===
        0
      ) {

        return;

      }


      groups.push({

        key:
          day,

        title:
          day,

        items:
          sortGroupItems_(
            items,
            'day'
          )

      });

    }
  );


  return groups;

}


/**
 * Group by Zoom Room.
 */
function buildRoomGroups_() {

  const map =
    {};


  recurring.forEach(
    function (item) {

      const roomId =
        item.room ||
        'ไม่ระบุห้อง';


      if (!map[roomId]) {

        map[roomId] =
          [];

      }


      map[roomId].push(
        item
      );

    }
  );


  const roomIds =
    Object.keys(
      map
    );


  roomIds.sort(
    compareRoomIds_
  );


  return roomIds.map(
    function (roomId) {

      return {

        key:
          roomId,

        title:
          getRoomName_(
            roomId
          ),

        items:
          sortGroupItems_(
            map[roomId],
            'room'
          )

      };

    }
  );

}


/**
 * Sort inside each group.
 *
 * Important:
 * Inactive always goes to
 * the end of ITS OWN group.
 */
function sortGroupItems_(
  items,
  groupType
) {

  return items
    .slice()
    .sort(
      function (a, b) {

        /*
         * Active first,
         * Inactive at group bottom.
         */
        if (
          Boolean(a.active) !==
          Boolean(b.active)
        ) {

          return a.active
            ? -1
            : 1;

        }


        /*
         * Grouped by DAY:
         * Room -> Start Time
         */
        if (
          groupType ===
          'day'
        ) {

          const roomCompare =
            compareRoomIds_(
              a.room,
              b.room
            );


          if (
            roomCompare !==
            0
          ) {

            return roomCompare;

          }

        }


        /*
         * Grouped by ROOM:
         * Day -> Start Time
         */
        if (
          groupType ===
          'room'
        ) {

          const dayA =
            DAY_ORDER.indexOf(
              a.dayOfWeek
            );


          const dayB =
            DAY_ORDER.indexOf(
              b.dayOfWeek
            );


          if (
            dayA !==
            dayB
          ) {

            return (
              dayA - dayB
            );

          }

        }


        const timeCompare =
          timeToMinutes_(
            a.startTime
          ) -
          timeToMinutes_(
            b.startTime
          );


        if (
          timeCompare !==
          0
        ) {

          return timeCompare;

        }


        return String(
          a.activity || ''
        )
          .localeCompare(
            String(
              b.activity || ''
            ),
            'th'
          );

      }
    );

}


/**
 * Dynamic Room order.
 *
 * Existing active rooms follow
 * DataStore Room order.
 *
 * Unknown / old inactive rooms
 * are placed after them.
 */
function compareRoomIds_(
  roomA,
  roomB
) {

  const rooms =
    DataStore.getRooms();


  const order =
    {};


  rooms.forEach(
    function (
      room,
      index
    ) {

      order[room.zoomId] =
        index;

    }
  );


  const aKnown =
    Object.prototype
      .hasOwnProperty
      .call(
        order,
        roomA
      );


  const bKnown =
    Object.prototype
      .hasOwnProperty
      .call(
        order,
        roomB
      );


  if (
    aKnown &&
    bKnown
  ) {

    return (
      order[roomA] -
      order[roomB]
    );

  }


  if (aKnown) {
    return -1;
  }


  if (bKnown) {
    return 1;
  }


  return String(
    roomA || ''
  )
    .localeCompare(
      String(
        roomB || ''
      )
    );

}


/**
 * One large Group Card.
 */
function createGroupCard_(
  group
) {

  const section =
    document.createElement(
      'section'
    );


  section.className =
    'admin-recurring-group-card';


  /*
   * HEADER
   */
  const header =
    document.createElement(
      'div'
    );


  header.className =
    'admin-recurring-group-header';


  const title =
    document.createElement(
      'h2'
    );


  title.className =
    'admin-recurring-group-title';


  title.textContent =
    group.title;


  const count =
    document.createElement(
      'span'
    );


  count.className =
    'admin-recurring-group-count';


  count.textContent =
    group.items.length +
    ' รายการ';


  header.appendChild(
    title
  );


  header.appendChild(
    count
  );


  /*
   * ITEMS
   */
  const itemsWrap =
    document.createElement(
      'div'
    );


  itemsWrap.className =
    'admin-recurring-group-items';


  let pausedSectionAdded =
    false;


  group.items.forEach(
    function (item) {

      /*
       * First inactive item
       * gets a separator.
       */
      if (
        !item.active &&
        !pausedSectionAdded
      ) {

        const divider =
          document.createElement(
            'div'
          );


        divider.className =
          'admin-recurring-paused-divider';


        divider.textContent =
          'รายการพัก';


        itemsWrap.appendChild(
          divider
        );


        pausedSectionAdded =
          true;

      }


      itemsWrap.appendChild(
        createGroupedItem_(
          item
        )
      );

    }
  );


  section.appendChild(
    header
  );


  section.appendChild(
    itemsWrap
  );


  return section;

}


/**
 * One Recurring row inside Group.
 *
 * Day View:
 *   Room + Actions
 *
 * Room View:
 *   Day + Actions
 */
function createGroupedItem_(
  item
) {

  const row =
    document.createElement(
      'article'
    );


  row.className =
    'admin-recurring-group-item';


  if (!item.active) {

    row.classList.add(
      'inactive'
    );

  }


  /*
   * TOP LINE
   */
  const topLine =
    document.createElement(
      'div'
    );


  topLine.className =
    'admin-recurring-item-topline';


  const context =
    document.createElement(
      'div'
    );


  context.className =
    'admin-recurring-item-context';


  context.textContent =
    viewMode ===
      'day'
      ? getRoomName_(
          item.room
        )
      : (
          item.dayOfWeek ||
          '-'
        );


  const actions =
    document.createElement(
      'div'
    );


  actions.className =
    'admin-recurring-group-actions';


  /*
   * EDIT
   */
  const editButton =
    createGroupActionButton_(
      'edit'
    );


  editButton.addEventListener(
    'click',
    function () {

      openEditModal_(
        item
      );

    }
  );


  /*
   * PAUSE / ACTIVATE
   */
  const toggleButton =
    createGroupActionButton_(
      item.active
        ? 'pause'
        : 'activate'
    );


  toggleButton.addEventListener(
    'click',
    function () {

      handleToggleActive_(
        item,
        toggleButton
      );

    }
  );


  /*
   * DELETE
   */
  const deleteButton =
    createGroupActionButton_(
      'delete'
    );


  deleteButton.addEventListener(
    'click',
    function () {

      handleDelete_(
        item,
        deleteButton
      );

    }
  );


  actions.appendChild(
    editButton
  );


  actions.appendChild(
    toggleButton
  );


  actions.appendChild(
    deleteButton
  );


  topLine.appendChild(
    context
  );


  topLine.appendChild(
    actions
  );


  /*
   * ACTIVITY
   */
  const activity =
    document.createElement(
      'div'
    );


  activity.className =
    'admin-recurring-item-activity';


  activity.textContent =
    item.activity ||
    'ไม่ระบุชื่อกิจกรรม';


  /*
   * META
   */
  const meta =
    document.createElement(
      'div'
    );


  meta.className =
    'admin-recurring-item-meta';


  const time =
    document.createElement(
      'span'
    );


  time.textContent =
    item.startTime +
    '–' +
    item.endTime;


  const dates =
    document.createElement(
      'span'
    );


  dates.textContent =
    formatShortDate_(
      item.startDate
    ) +
    ' → ' +
    formatShortDate_(
      item.endDate
    );


  meta.appendChild(
    time
  );


  meta.appendChild(
    dates
  );


  if (!item.active) {

    const paused =
      document.createElement(
        'span'
      );


    paused.className =
      'admin-recurring-paused';


    paused.textContent =
      'พักอยู่';


    meta.appendChild(
      paused
    );

  }


  row.appendChild(
    topLine
  );


  row.appendChild(
    activity
  );


  row.appendChild(
    meta
  );


  return row;

}


/**
 * Icon-only actions.
 */
function createGroupActionButton_(
  type
) {

  const button =
    document.createElement(
      'button'
    );


  button.type =
    'button';


  button.className =
    'admin-recurring-group-action ' +
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


  else if (
    type ===
    'pause'
  ) {

    label =
      'พัก';


    svg =
      `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="6.5" y="5" width="3.5" height="14" rx="1"></rect>
        <rect x="14" y="5" width="3.5" height="14" rx="1"></rect>
      </svg>
      `;

  }


  else if (
    type ===
    'activate'
  ) {

    label =
      'เปิดใช้งาน';


    svg =
      `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path d="M8 5l10 7-10 7V5z"></path>
      </svg>
      `;

  }


  else if (
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

function createCard_(
  item
) {

  const card =
    document.createElement(
      'article'
    );


  card.className =
    'admin-recurring-card';


  if (!item.active) {

    card.classList.add(
      'inactive'
    );

  }


  /*
   * TOP LINE
   * Day left / Actions right
   */
  const topLine =
    document.createElement(
      'div'
    );


  topLine.className =
    'admin-recurring-topline';


  const day =
    document.createElement(
      'div'
    );


  day.className =
    'admin-recurring-day';


  day.textContent =
    item.dayOfWeek ||
    '-';


  /*
   * ACTIONS
   */
  const actions =
    document.createElement(
      'div'
    );


  actions.className =
    'admin-recurring-actions';


  const editButton =
    createActionButton_(
      'edit'
    );


  editButton.addEventListener(
    'click',
    function () {

      openEditModal_(
        item
      );

    }
  );


  const toggleButton =
    createActionButton_(
      item.active
        ? 'pause'
        : 'activate'
    );


  toggleButton.addEventListener(
    'click',
    function () {

      handleToggleActive_(
        item,
        toggleButton
      );

    }
  );


  const deleteButton =
    createActionButton_(
      'delete'
    );


  deleteButton.addEventListener(
    'click',
    function () {

      handleDelete_(
        item,
        deleteButton
      );

    }
  );


  actions.appendChild(
    editButton
  );


  actions.appendChild(
    toggleButton
  );


  actions.appendChild(
    deleteButton
  );


  topLine.appendChild(
    day
  );


  topLine.appendChild(
    actions
  );


  /*
   * MAIN
   */
  const main =
    document.createElement(
      'div'
    );


  main.className =
    'admin-recurring-main';


  const activity =
    document.createElement(
      'strong'
    );


  activity.className =
    'admin-recurring-activity';


  activity.textContent =
    item.activity ||
    'ไม่ระบุชื่อกิจกรรม';


  const meta =
    document.createElement(
      'div'
    );


  meta.className =
    'admin-recurring-meta';


  const room =
    document.createElement(
      'span'
    );


  room.textContent =
    getRoomName_(
      item.room
    );


  const time =
    document.createElement(
      'span'
    );


  time.textContent =
    item.startTime +
    '–' +
    item.endTime;


  const dates =
    document.createElement(
      'span'
    );


  dates.textContent =
    formatShortDate_(
      item.startDate
    ) +
    ' → ' +
    formatShortDate_(
      item.endDate
    );


  meta.appendChild(
    room
  );


  meta.appendChild(
    time
  );


  meta.appendChild(
    dates
  );


  if (!item.active) {

    const paused =
      document.createElement(
        'span'
      );


    paused.className =
      'admin-recurring-paused';


    paused.textContent =
      'พักอยู่';


    meta.appendChild(
      paused
    );

  }


  main.appendChild(
    activity
  );


  main.appendChild(
    meta
  );


  card.appendChild(
    topLine
  );


  card.appendChild(
    main
  );


  return card;

}


function createActionButton_(
  type
) {

  const button =
    document.createElement(
      'button'
    );


  button.type =
    'button';


  button.className =
    'admin-recurring-action ' +
    type;


  let icon =
    '';


  let label =
    '';


  if (type === 'edit') {

    icon =
      '✎';

    label =
      'แก้ไข';

  } else if (
    type === 'pause'
  ) {

    icon =
      '⏸';

    label =
      'พัก';

  } else if (
    type === 'activate'
  ) {

    icon =
      '↻';

    label =
      'เปิดใช้งาน';

  } else if (
    type === 'delete'
  ) {

    icon =
      '✕';

    label =
      'ลบ';

  }


  button.textContent =
    icon;


  button.title =
    label;


  button.setAttribute(
    'aria-label',
    label
  );


  return button;

}


  /* =======================================================
     CREATE MODAL
  ======================================================= */


  function openCreateModal_() {

    editingItem =
      null;


    elements.form.reset();


    elements.modalTitle.textContent =
      'เพิ่มกิจกรรมประจำ';


    elements.modalDescription.textContent =
      'กำหนดวัน เวลา และช่วงวันที่ของกิจกรรมประจำ';


    populateRoomOptions_(
      ''
    );


    populateStartTimes_(
      ''
    );


    resetEndTimes_();


    elements.active.checked =
      true;


    clearModalMessage_();


    openModal_();


    setTimeout(
      function () {

        elements.activity.focus();

      },
      50
    );

  }


  /* =======================================================
     EDIT MODAL
  ======================================================= */


  function openEditModal_(
    item
  ) {

    editingItem =
      item;


    elements.modalTitle.textContent =
      'แก้ไขกิจกรรมประจำ';


    elements.modalDescription.textContent =
      'ปรับกิจกรรม วัน เวลา ห้อง และสถานะการใช้งาน';


    elements.activity.value =
      item.activity ||
      '';


    populateRoomOptions_(
      item.room
    );


    elements.dayOfWeek.value =
      item.dayOfWeek ||
      'จันทร์';


    elements.startDate.value =
      item.startDate ||
      '';


    elements.endDate.value =
      item.endDate ||
      '';


    populateStartTimes_(
      item.startTime
    );


    populateEndTimes_(
      item.startTime,
      item.endTime
    );


    elements.active.checked =
      Boolean(
        item.active
      );


    clearModalMessage_();


    openModal_();

  }


  /* =======================================================
     ROOM / TIME
  ======================================================= */


  function populateRoomOptions_(
    selectedRoom
  ) {

    elements.room.innerHTML =
      '';


    const rooms =
      DataStore.getRooms();


    /*
     * If old Recurring belongs to a Room
     * not present in Active Room cache,
     * keep that value available while editing.
     */
    if (
      selectedRoom &&
      !rooms.some(
        function (room) {

          return (
            room.zoomId ===
            selectedRoom
          );

        }
      )
    ) {

      const legacy =
        document.createElement(
          'option'
        );


      legacy.value =
        selectedRoom;


      legacy.textContent =
        selectedRoom +
        ' (ปิดใช้งาน)';


      elements.room.appendChild(
        legacy
      );

    }


    rooms.forEach(
      function (room) {

        const option =
          document.createElement(
            'option'
          );


        option.value =
          room.zoomId;


        option.textContent =
          room.zoomName ||
          room.zoomId;


        if (
          room.zoomId ===
          selectedRoom
        ) {

          option.selected =
            true;

        }


        elements.room.appendChild(
          option
        );

      }
    );

  }


  function populateStartTimes_(
    preferred
  ) {

    fillSelect_(
      elements.startTime,
      DataStore.getSlots(),
      'เลือกเวลาเริ่ม'
    );


    if (
      preferred &&
      DataStore
        .getSlots()
        .indexOf(
          preferred
        ) !==
        -1
    ) {

      elements.startTime.value =
        preferred;

    }

  }


  function populateEndTimes_(
    startTime,
    preferred
  ) {

    if (!startTime) {

      resetEndTimes_();

      return;

    }


    const startMinutes =
      timeToMinutes_(
        startTime
      );


    const validEnds =
      DataStore
        .getSlots()
        .filter(
          function (time) {

            return (
              timeToMinutes_(
                time
              ) >
              startMinutes
            );

          }
        );


    fillSelect_(
      elements.endTime,
      validEnds,
      'เลือกเวลาสิ้นสุด'
    );


    elements.endTime.disabled =
      validEnds.length ===
      0;


    if (
      preferred &&
      validEnds.indexOf(
        preferred
      ) !==
      -1
    ) {

      elements.endTime.value =
        preferred;

    }

  }


  function resetEndTimes_() {

    fillSelect_(
      elements.endTime,
      [],
      'เลือกเวลาเริ่มก่อน'
    );


    elements.endTime.disabled =
      true;

  }


  /* =======================================================
     SAVE CREATE / UPDATE
  ======================================================= */


  async function handleSubmit_(
    event
  ) {

    event.preventDefault();


    clearModalMessage_();


    const activity =
      elements.activity.value.trim();


    const room =
      elements.room.value;


    const dayOfWeek =
      elements.dayOfWeek.value;


    const startDate =
      elements.startDate.value;


    const endDate =
      elements.endDate.value;


    const startTime =
      elements.startTime.value;


    const endTime =
      elements.endTime.value;


    const active =
      elements.active.checked;


    if (!activity) {

      showModalMessage_(
        'กรุณาระบุชื่อกิจกรรม',
        'warning'
      );

      return;

    }


    if (!room) {

      showModalMessage_(
        'กรุณาเลือกห้อง Zoom',
        'warning'
      );

      return;

    }


    if (!dayOfWeek) {

      showModalMessage_(
        'กรุณาเลือกวันประจำสัปดาห์',
        'warning'
      );

      return;

    }


    if (
      !startDate ||
      !endDate
    ) {

      showModalMessage_(
        'กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด',
        'warning'
      );

      return;

    }


    if (
      endDate <
      startDate
    ) {

      showModalMessage_(
        'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น',
        'warning'
      );

      return;

    }


    if (
      !startTime ||
      !endTime
    ) {

      showModalMessage_(
        'กรุณาเลือกเวลาเริ่มและเวลาสิ้นสุด',
        'warning'
      );

      return;

    }


    const payload = {

      userId:
        getCurrentAdminId_(),

      activity:
        activity,

      room:
        room,

      dayOfWeek:
        dayOfWeek,

      startTime:
        startTime,

      endTime:
        endTime,

      startDate:
        startDate,

      endDate:
        endDate,

      active:
        active

    };


    setSaving_(
      true
    );


    try {

      if (editingItem) {

        payload.id =
          editingItem.id;


        await API.updateRecurring(
          payload
        );


        showToast_(
          'แก้ไขกิจกรรมประจำแล้ว',
          'success'
        );


      } else {

        await API.createRecurring(
          payload
        );


        showToast_(
          'เพิ่มกิจกรรมประจำแล้ว',
          'success'
        );

      }


      setSaving_(
        false
      );


      closeModal_();


      await refreshAfterMutation_();


    } catch (error) {

      console.error(
        error
      );


      showModalMessage_(
        error.message ||
        'ไม่สามารถบันทึกกิจกรรมประจำได้',

        error.code ===
          'RECURRING_CONFLICT'
          ? 'warning'
          : 'error'
      );


      setSaving_(
        false
      );

    }

  }


  /* =======================================================
     PAUSE / ACTIVATE
  ======================================================= */


  async function handleToggleActive_(
    item,
    button
  ) {

    const nextActive =
      !item.active;


    const accepted =
      window.confirm(
        nextActive
          ? 'ต้องการเปิดใช้งาน "' +
            item.activity +
            '" ใช่หรือไม่?'
          : 'ต้องการพัก "' +
            item.activity +
            '" ใช่หรือไม่?'
      );


    if (!accepted) {
      return;
    }


    setActionBusy_(
      button,
      true
    );


    try {

      await API.updateRecurring({

        userId:
          getCurrentAdminId_(),

        id:
          item.id,

        activity:
          item.activity,

        room:
          item.room,

        dayOfWeek:
          item.dayOfWeek,

        startTime:
          item.startTime,

        endTime:
          item.endTime,

        startDate:
          item.startDate,

        endDate:
          item.endDate,

        active:
          nextActive

      });


      showToast_(
        nextActive
          ? 'เปิดใช้งานกิจกรรมประจำแล้ว'
          : 'พักกิจกรรมประจำแล้ว',

        'success'
      );


      await refreshAfterMutation_();


    } catch (error) {

      console.error(
        error
      );


      showToast_(
        error.message ||
        'ไม่สามารถเปลี่ยนสถานะได้',

        'error'
      );


      setActionBusy_(
        button,
        false
      );

    }

  }


  /* =======================================================
     DELETE
  ======================================================= */


  async function handleDelete_(
    item,
    button
  ) {

    const accepted =
      window.confirm(
        'ต้องการลบกิจกรรมประจำ "' +
        item.activity +
        '" ถาวรใช่หรือไม่?\n\n' +
        'การลบนี้ไม่สามารถย้อนกลับได้'
      );


    if (!accepted) {
      return;
    }


    setActionBusy_(
      button,
      true
    );


    try {

      await API.deleteRecurring(
        getCurrentAdminId_(),
        item.id
      );


      showToast_(
        'ลบกิจกรรมประจำแล้ว',
        'success'
      );


      await refreshAfterMutation_();


    } catch (error) {

      console.error(
        error
      );


      showToast_(
        error.message ||
        'ไม่สามารถลบกิจกรรมประจำได้',
        'error'
      );


      setActionBusy_(
        button,
        false
      );

    }

  }


  /* =======================================================
     REFRESH
  ======================================================= */


 async function refreshAfterMutation_() {

  /*
   * 1. Refresh Admin list first.
   *
   * IMPORTANT:
   * This API returns both
   * Active + Inactive.
   */
  await loadRecurring_();


  /*
   * 2. Refresh Home Timeline separately.
   *
   * DataStore contains Active Recurring only,
   * which is correct for Home.
   */
  await Timeline
    .refreshRecurring();

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


    editingItem =
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


  function setActionBusy_(
    button,
    busy
  ) {

    if (!button) {
      return;
    }


    if (busy) {

      button.dataset.oldText =
        button.textContent;


      button.disabled =
        true;


      button.textContent =
        '...';


    } else {

      button.disabled =
        false;


      if (
        button.dataset.oldText
      ) {

        button.textContent =
          button.dataset.oldText;

      }

    }

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


    elements.list.innerHTML =
      '';


    elements.error.textContent =
      message;


    elements.error
      .classList
      .remove(
        'hidden'
      );

  }


  function showModalMessage_(
    message,
    type
  ) {

    elements.message.textContent =
      message;


    elements.message.className =
      'admin-recurring-message ' +
      (
        type ||
        'warning'
      );

  }


  function clearModalMessage_() {

    elements.message.textContent =
      '';


    elements.message.className =
      'admin-recurring-message hidden';

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
      function () {

        toast.classList.add(
          'hidden'
        );

      },
      3500
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


  function getRoomName_(
    roomId
  ) {

    const room =
      DataStore
        .getRooms()
        .find(
          function (item) {

            return (
              item.zoomId ===
              roomId
            );

          }
        );


    if (!room) {

      return roomId ||
        '-';

    }


    return (
      room.zoomName ||
      room.zoomId
    );

  }


  function fillSelect_(
    select,
    values,
    placeholder
  ) {

    select.innerHTML =
      '';


    const first =
      document.createElement(
        'option'
      );


    first.value =
      '';


    first.textContent =
      placeholder;


    select.appendChild(
      first
    );


    values.forEach(
      function (value) {

        const option =
          document.createElement(
            'option'
          );


        option.value =
          value;


        option.textContent =
          value;


        select.appendChild(
          option
        );

      }
    );

  }


  function timeToMinutes_(
    value
  ) {

    const parts =
      String(
        value || ''
      )
        .split(':');


    return (
      Number(parts[0]) *
        60 +
      Number(parts[1])
    );

  }


  function formatShortDate_(
    dateString
  ) {

    if (
      !dateString ||
      !/^\d{4}-\d{2}-\d{2}$/
        .test(
          dateString
        )
    ) {

      return dateString ||
        '-';

    }


    const parts =
      dateString.split('-');


    return (
      parts[2] +
      '/' +
      parts[1] +
      '/' +
      parts[0]
    );

  }


  return {

    init,
    open,

    reload:
      loadRecurring_

  };

})();


document.addEventListener(
  'DOMContentLoaded',
  AdminRecurring.init
);