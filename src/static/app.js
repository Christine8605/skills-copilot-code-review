document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  const registrationModal = document.getElementById("registration-modal");
  const modalActivityName = document.getElementById("modal-activity-name");
  const signupForm = document.getElementById("signup-form");
  const activityInput = document.getElementById("activity");
  const closeRegistrationModal = document.querySelector(".close-modal");
  const announcementsContainer = document.getElementById("announcements-container");

  const searchInput = document.getElementById("activity-search");
  const searchButton = document.getElementById("search-button");
  const categoryFilters = document.querySelectorAll(".category-filter");
  const dayFilters = document.querySelectorAll(".day-filter");
  const timeFilters = document.querySelectorAll(".time-filter");

  const loginButton = document.getElementById("login-button");
  const userInfo = document.getElementById("user-info");
  const displayName = document.getElementById("display-name");
  const logoutButton = document.getElementById("logout-button");
  const loginModal = document.getElementById("login-modal");
  const loginForm = document.getElementById("login-form");
  const closeLoginModal = document.querySelector(".close-login-modal");
  const loginMessage = document.getElementById("login-message");

  const manageAnnouncementsButton = document.getElementById("manage-announcements-button");
  const announcementModal = document.getElementById("announcement-modal");
  const closeAnnouncementModal = document.querySelector(".close-announcement-modal");
  const announcementList = document.getElementById("announcement-list");
  const announcementForm = document.getElementById("announcement-form");
  const announcementFormTitle = document.getElementById("announcement-form-title");
  const announcementIdInput = document.getElementById("announcement-id");
  const announcementTitleInput = document.getElementById("announcement-title");
  const announcementMessageInput = document.getElementById("announcement-message");
  const announcementStartDateInput = document.getElementById("announcement-start-date");
  const announcementExpirationDateInput = document.getElementById("announcement-expiration-date");
  const announcementCancelEditButton = document.getElementById("announcement-cancel-edit");
  const announcementSaveButton = document.getElementById("announcement-save-button");
  const announcementModalMessage = document.getElementById("announcement-modal-message");

  const activityTypes = {
    sports: { label: "Sports", color: "#e8f5e9", textColor: "#2e7d32" },
    arts: { label: "Arts", color: "#fff0ef", textColor: "#8f2d1c" },
    academic: { label: "Academic", color: "#e4f3ff", textColor: "#004b7c" },
    community: { label: "Community", color: "#fff4dd", textColor: "#8f5300" },
    technology: { label: "Technology", color: "#edf0ff", textColor: "#2d3990" },
  };

  let allActivities = {};
  let allAnnouncements = [];
  let currentFilter = "all";
  let searchQuery = "";
  let currentDay = "";
  let currentTimeRange = "";
  let currentUser = null;

  const timeRanges = {
    morning: { start: "06:00", end: "08:00" },
    afternoon: { start: "15:00", end: "18:00" },
    weekend: { days: ["Saturday", "Sunday"] },
  };

  function initializeFilters() {
    const activeDayFilter = document.querySelector(".day-filter.active");
    if (activeDayFilter) {
      currentDay = activeDayFilter.dataset.day;
    }

    const activeTimeFilter = document.querySelector(".time-filter.active");
    if (activeTimeFilter) {
      currentTimeRange = activeTimeFilter.dataset.time;
    }
  }

  function setDayFilter(day) {
    currentDay = day;
    dayFilters.forEach((button) => {
      button.classList.toggle("active", button.dataset.day === day);
    });
    fetchActivities();
  }

  function setTimeRangeFilter(timeRange) {
    currentTimeRange = timeRange;
    timeFilters.forEach((button) => {
      button.classList.toggle("active", button.dataset.time === timeRange);
    });
    fetchActivities();
  }

  function checkAuthentication() {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) {
      updateAuthUI();
      return;
    }

    try {
      currentUser = JSON.parse(savedUser);
      updateAuthUI();
      validateUserSession(currentUser.username);
    } catch (error) {
      console.error("Error parsing saved user", error);
      logout(false);
    }
  }

  async function validateUserSession(username) {
    try {
      const response = await fetch(`/auth/check-session?username=${encodeURIComponent(username)}`);
      if (!response.ok) {
        logout();
        return;
      }

      const userData = await response.json();
      currentUser = userData;
      localStorage.setItem("currentUser", JSON.stringify(userData));
      updateAuthUI();
    } catch (error) {
      console.error("Error validating session:", error);
    }
  }

  function updateAuthUI() {
    const isSignedIn = Boolean(currentUser);
    loginButton.classList.toggle("hidden", isSignedIn);
    userInfo.classList.toggle("hidden", !isSignedIn);
    displayName.textContent = isSignedIn ? currentUser.display_name : "";
    manageAnnouncementsButton.classList.toggle("hidden", !isSignedIn);
    updateAuthBodyClass();
    fetchActivities();
  }

  function updateAuthBodyClass() {
    document.body.classList.toggle("not-authenticated", !currentUser);
  }

  async function login(username, password) {
    try {
      const response = await fetch(
        `/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        { method: "POST" }
      );
      const data = await response.json();

      if (!response.ok) {
        showLoginMessage(data.detail || "Invalid username or password", "error");
        return false;
      }

      currentUser = data;
      localStorage.setItem("currentUser", JSON.stringify(data));
      updateAuthUI();
      closeLoginModalHandler();
      showMessage(`Welcome, ${currentUser.display_name}!`, "success");
      return true;
    } catch (error) {
      console.error("Error during login:", error);
      showLoginMessage("Login failed. Please try again.", "error");
      return false;
    }
  }

  function logout(showFeedback = true) {
    currentUser = null;
    localStorage.removeItem("currentUser");
    if (!announcementModal.classList.contains("hidden")) {
      closeAnnouncementModalHandler();
    }
    updateAuthUI();
    if (showFeedback) {
      showMessage("You have been logged out.", "info");
    }
  }

  function showLoginMessage(text, type) {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
    loginMessage.classList.remove("hidden");
  }

  function openLoginModal() {
    loginModal.classList.remove("hidden");
    loginModal.classList.add("show");
    loginMessage.classList.add("hidden");
    loginForm.reset();
  }

  function closeLoginModalHandler() {
    loginModal.classList.remove("show");
    setTimeout(() => {
      loginModal.classList.add("hidden");
      loginForm.reset();
    }, 300);
  }

  loginButton.addEventListener("click", openLoginModal);
  logoutButton.addEventListener("click", () => logout(true));
  closeLoginModal.addEventListener("click", closeLoginModalHandler);

  window.addEventListener("click", (event) => {
    if (event.target === loginModal) {
      closeLoginModalHandler();
    }
    if (event.target === registrationModal) {
      closeRegistrationModalHandler();
    }
    if (event.target === announcementModal) {
      closeAnnouncementModalHandler();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    await login(username, password);
  });

  function showLoadingSkeletons() {
    activitiesList.innerHTML = "";
    for (let index = 0; index < 9; index += 1) {
      const skeletonCard = document.createElement("div");
      skeletonCard.className = "skeleton-card";
      skeletonCard.innerHTML = `
        <div class="skeleton-line skeleton-title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-text short"></div>
        <div style="margin-top: 8px;">
          <div class="skeleton-line" style="height: 6px;"></div>
          <div class="skeleton-line skeleton-text short" style="height: 8px; margin-top: 3px;"></div>
        </div>
        <div style="margin-top: auto;">
          <div class="skeleton-line" style="height: 24px; margin-top: 8px;"></div>
        </div>
      `;
      activitiesList.appendChild(skeletonCard);
    }
  }

  function formatSchedule(details) {
    if (details.schedule_details) {
      const days = details.schedule_details.days.join(", ");
      const formatTime = (time24) => {
        if (typeof time24 !== "string") {
          return "Invalid time";
        }

        const timeMatch = time24.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
        if (!timeMatch) {
          return "Invalid time";
        }

        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      const startTime = formatTime(details.schedule_details.start_time);
      const endTime = formatTime(details.schedule_details.end_time);
      return `${days}, ${startTime} - ${endTime}`;
    }

    return details.schedule;
  }

  function getActivityType(activityName, description) {
    const name = activityName.toLowerCase();
    const desc = description.toLowerCase();
    if (
      name.includes("soccer") ||
      name.includes("basketball") ||
      name.includes("sport") ||
      name.includes("fitness") ||
      desc.includes("team") ||
      desc.includes("game") ||
      desc.includes("athletic")
    ) {
      return "sports";
    }
    if (
      name.includes("art") ||
      name.includes("music") ||
      name.includes("theater") ||
      name.includes("drama") ||
      desc.includes("creative") ||
      desc.includes("paint")
    ) {
      return "arts";
    }
    if (
      name.includes("science") ||
      name.includes("math") ||
      name.includes("academic") ||
      name.includes("study") ||
      name.includes("olympiad") ||
      desc.includes("learning") ||
      desc.includes("education") ||
      desc.includes("competition")
    ) {
      return "academic";
    }
    if (
      name.includes("volunteer") ||
      name.includes("community") ||
      desc.includes("service") ||
      desc.includes("volunteer")
    ) {
      return "community";
    }
    if (
      name.includes("computer") ||
      name.includes("coding") ||
      name.includes("tech") ||
      name.includes("robotics") ||
      desc.includes("programming") ||
      desc.includes("technology") ||
      desc.includes("digital") ||
      desc.includes("robot")
    ) {
      return "technology";
    }
    return "academic";
  }

  async function fetchActivities() {
    showLoadingSkeletons();

    try {
      const queryParams = [];
      if (currentDay) {
        queryParams.push(`day=${encodeURIComponent(currentDay)}`);
      }

      if (currentTimeRange && currentTimeRange !== "weekend") {
        const range = timeRanges[currentTimeRange];
        if (range) {
          queryParams.push(`start_time=${encodeURIComponent(range.start)}`);
          queryParams.push(`end_time=${encodeURIComponent(range.end)}`);
        }
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`/activities${queryString}`);
      allActivities = await response.json();
      displayFilteredActivities();
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function displayFilteredActivities() {
    activitiesList.innerHTML = "";
    const filteredActivities = {};

    Object.entries(allActivities).forEach(([name, details]) => {
      const activityType = getActivityType(name, details.description);
      if (currentFilter !== "all" && activityType !== currentFilter) {
        return;
      }

      if (currentTimeRange === "weekend" && details.schedule_details) {
        const isWeekendActivity = details.schedule_details.days.some((day) =>
          timeRanges.weekend.days.includes(day)
        );
        if (!isWeekendActivity) {
          return;
        }
      }

      const searchableContent = [
        name.toLowerCase(),
        details.description.toLowerCase(),
        formatSchedule(details).toLowerCase(),
      ].join(" ");
      if (searchQuery && !searchableContent.includes(searchQuery.toLowerCase())) {
        return;
      }

      filteredActivities[name] = details;
    });

    if (Object.keys(filteredActivities).length === 0) {
      activitiesList.innerHTML = `
        <div class="no-results">
          <h4>No activities found</h4>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      `;
      return;
    }

    Object.entries(filteredActivities).forEach(([name, details]) => {
      renderActivityCard(name, details);
    });
  }

  function renderActivityCard(name, details) {
    const activityCard = document.createElement("div");
    activityCard.className = "activity-card";

    const totalSpots = details.max_participants;
    const takenSpots = details.participants.length;
    const spotsLeft = totalSpots - takenSpots;
    const capacityPercentage = (takenSpots / totalSpots) * 100;
    const isFull = spotsLeft <= 0;

    let capacityStatusClass = "capacity-available";
    if (isFull) {
      capacityStatusClass = "capacity-full";
    } else if (capacityPercentage >= 75) {
      capacityStatusClass = "capacity-near-full";
    }

    const activityType = getActivityType(name, details.description);
    const typeInfo = activityTypes[activityType];
    const formattedSchedule = formatSchedule(details);

    activityCard.innerHTML = `
      <span class="activity-tag" style="background-color: ${typeInfo.color}; color: ${typeInfo.textColor}">
        ${typeInfo.label}
      </span>
      <h4>${name}</h4>
      <p>${details.description}</p>
      <p class="tooltip">
        <strong>Schedule:</strong> ${formattedSchedule}
        <span class="tooltip-text">Regular meetings at this time throughout the semester</span>
      </p>
      <div class="capacity-container ${capacityStatusClass}">
        <div class="capacity-bar-bg">
          <div class="capacity-bar-fill" style="width: ${capacityPercentage}%"></div>
        </div>
        <div class="capacity-text">
          <span>${takenSpots} enrolled</span>
          <span>${spotsLeft} spots left</span>
        </div>
      </div>
      <div class="participants-list">
        <h5>Current Participants:</h5>
        <ul>
          ${details.participants
            .map(
              (email) => `
            <li>
              ${email}
              ${
                currentUser
                  ? `<span class="delete-participant tooltip" data-activity="${name}" data-email="${email}" role="button" tabindex="0" aria-label="Unregister ${email}">✖<span class="tooltip-text">Unregister this student</span></span>`
                  : ""
              }
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="activity-card-actions">
        ${
          currentUser
            ? `<button class="register-button" data-activity="${name}" ${isFull ? "disabled" : ""}>${
                isFull ? "Activity Full" : "Register Student"
              }</button>`
            : `<div class="auth-notice">Teachers can register students.</div>`
        }
      </div>
    `;

    activityCard.querySelectorAll(".delete-participant").forEach((button) => {
      button.addEventListener("click", handleUnregister);
      button.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleUnregister({ currentTarget: button });
        }
      });
    });

    if (currentUser && !isFull) {
      const registerButton = activityCard.querySelector(".register-button");
      registerButton.addEventListener("click", () => {
        openRegistrationModal(name);
      });
    }

    activitiesList.appendChild(activityCard);
  }

  searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value;
    displayFilteredActivities();
  });

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    searchQuery = searchInput.value;
    displayFilteredActivities();
  });

  categoryFilters.forEach((button) => {
    button.addEventListener("click", () => {
      categoryFilters.forEach((target) => target.classList.remove("active"));
      button.classList.add("active");
      currentFilter = button.dataset.category;
      displayFilteredActivities();
    });
  });

  dayFilters.forEach((button) => {
    button.addEventListener("click", () => {
      dayFilters.forEach((target) => target.classList.remove("active"));
      button.classList.add("active");
      currentDay = button.dataset.day;
      fetchActivities();
    });
  });

  timeFilters.forEach((button) => {
    button.addEventListener("click", () => {
      timeFilters.forEach((target) => target.classList.remove("active"));
      button.classList.add("active");
      currentTimeRange = button.dataset.time;
      fetchActivities();
    });
  });

  function openRegistrationModal(activityName) {
    modalActivityName.textContent = activityName;
    activityInput.value = activityName;
    registrationModal.classList.remove("hidden");
    setTimeout(() => {
      registrationModal.classList.add("show");
    }, 10);
  }

  function closeRegistrationModalHandler() {
    registrationModal.classList.remove("show");
    setTimeout(() => {
      registrationModal.classList.add("hidden");
      signupForm.reset();
    }, 300);
  }

  closeRegistrationModal.addEventListener("click", closeRegistrationModalHandler);

  function showConfirmationDialog(message, confirmCallback) {
    let confirmDialog = document.getElementById("confirm-dialog");
    if (!confirmDialog) {
      confirmDialog = document.createElement("div");
      confirmDialog.id = "confirm-dialog";
      confirmDialog.className = "modal hidden";
      confirmDialog.innerHTML = `
        <div class="modal-content">
          <h3>Confirm Action</h3>
          <p id="confirm-message"></p>
          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px;">
            <button id="cancel-button" class="secondary-button">Cancel</button>
            <button id="confirm-button" class="danger-button">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmDialog);
    }

    const confirmMessage = document.getElementById("confirm-message");
    confirmMessage.textContent = message;
    confirmDialog.classList.remove("hidden");
    setTimeout(() => confirmDialog.classList.add("show"), 10);

    const cancelButton = document.getElementById("cancel-button");
    const confirmButton = document.getElementById("confirm-button");
    const newCancelButton = cancelButton.cloneNode(true);
    const newConfirmButton = confirmButton.cloneNode(true);
    cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
    confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);

    newCancelButton.addEventListener("click", () => {
      confirmDialog.classList.remove("show");
      setTimeout(() => confirmDialog.classList.add("hidden"), 300);
    });

    newConfirmButton.addEventListener("click", () => {
      confirmCallback();
      confirmDialog.classList.remove("show");
      setTimeout(() => confirmDialog.classList.add("hidden"), 300);
    });
  }

  async function handleUnregister(event) {
    if (!currentUser) {
      showMessage("You must be logged in as a teacher to unregister students.", "error");
      return;
    }

    const source = event.currentTarget;
    const activity = source.dataset.activity;
    const email = source.dataset.email;

    showConfirmationDialog(
      `Are you sure you want to unregister ${email} from ${activity}?`,
      async () => {
        try {
          const response = await fetch(
            `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(
              email
            )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
            { method: "POST" }
          );
          const result = await response.json();

          if (response.ok) {
            showMessage(result.message, "success");
            fetchActivities();
          } else {
            showMessage(result.detail || "An error occurred", "error");
          }
        } catch (error) {
          showMessage("Failed to unregister. Please try again.", "error");
          console.error("Error unregistering:", error);
        }
      }
    );
  }

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) {
      showMessage("You must be logged in as a teacher to register students.", "error");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = activityInput.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(
          email
        )}&teacher_username=${encodeURIComponent(currentUser.username)}`,
        { method: "POST" }
      );

      const result = await response.json();
      if (response.ok) {
        showMessage(result.message, "success");
        closeRegistrationModalHandler();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  function parseDateLabel(dateValue) {
    if (!dateValue) {
      return "Not set";
    }
    const dateObj = new Date(dateValue);
    return Number.isNaN(dateObj.getTime())
      ? dateValue
      : dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function escapeHtml(value) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchAnnouncements(activeOnly = true) {
    const response = await fetch(`/announcements?active_only=${activeOnly}`);
    if (!response.ok) {
      throw new Error("Failed to load announcements");
    }
    return response.json();
  }

  async function refreshPublicAnnouncements() {
    try {
      const activeAnnouncements = await fetchAnnouncements(true);
      renderPublicAnnouncements(activeAnnouncements);
    } catch (error) {
      announcementsContainer.innerHTML = "<p class='announcement-placeholder'>Announcements are temporarily unavailable.</p>";
      console.error("Error loading announcements:", error);
    }
  }

  function renderPublicAnnouncements(announcements) {
    if (!announcements.length) {
      announcementsContainer.innerHTML = "<p class='announcement-placeholder'>No active announcements right now.</p>";
      return;
    }

    announcementsContainer.innerHTML = announcements
      .map(
        (item) => `
          <article class="announcement-card" role="status">
            <p class="announcement-title"><strong>Announcement:</strong> ${escapeHtml(item.title || "Untitled")}</p>
            <p class="announcement-message">${escapeHtml(item.message || "No message provided.")}</p>
          </article>
        `
      )
      .join("");
  }

  function showAnnouncementModalMessage(text, type) {
    announcementModalMessage.textContent = text;
    announcementModalMessage.className = `message ${type}`;
    announcementModalMessage.classList.remove("hidden");
  }

  function clearAnnouncementModalMessage() {
    announcementModalMessage.classList.add("hidden");
  }

  function resetAnnouncementForm() {
    announcementIdInput.value = "";
    announcementFormTitle.textContent = "Add Announcement";
    announcementSaveButton.textContent = "Save Announcement";
    announcementCancelEditButton.classList.add("hidden");
    announcementForm.reset();
  }

  function getAnnouncementStatus(announcement) {
    const today = new Date().toISOString().slice(0, 10);
    if (announcement.expiration_date < today) {
      return { label: "Expired", className: "status-expired" };
    }
    if (announcement.start_date && announcement.start_date > today) {
      return { label: "Scheduled", className: "status-scheduled" };
    }
    return { label: "Active", className: "status-active" };
  }

  function renderAnnouncementList() {
    if (!allAnnouncements.length) {
      announcementList.innerHTML = "<p class='announcement-empty'>No announcements yet. Add one to get started.</p>";
      return;
    }

    announcementList.innerHTML = allAnnouncements
      .map((announcement) => {
        const status = getAnnouncementStatus(announcement);
        return `
          <article class="announcement-row" data-announcement-id="${announcement.id}">
            <div class="announcement-row-main">
              <h5>${escapeHtml(announcement.title)}</h5>
              <p>${escapeHtml(announcement.message)}</p>
              <p class="announcement-row-dates">
                Start: ${parseDateLabel(announcement.start_date)} • Expires: ${parseDateLabel(announcement.expiration_date)}
              </p>
            </div>
            <div class="announcement-row-actions">
              <span class="announcement-status ${status.className}">${status.label}</span>
              <button type="button" class="secondary-button announcement-edit-btn" data-announcement-id="${announcement.id}">Edit</button>
              <button type="button" class="danger-button announcement-delete-btn" data-announcement-id="${announcement.id}">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");

    announcementList.querySelectorAll(".announcement-edit-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = allAnnouncements.find((item) => item.id === button.dataset.announcementId);
        if (!selected) {
          return;
        }
        announcementIdInput.value = selected.id;
        announcementTitleInput.value = selected.title;
        announcementMessageInput.value = selected.message;
        announcementStartDateInput.value = selected.start_date || "";
        announcementExpirationDateInput.value = selected.expiration_date;
        announcementFormTitle.textContent = "Edit Announcement";
        announcementSaveButton.textContent = "Update Announcement";
        announcementCancelEditButton.classList.remove("hidden");
      });
    });

    announcementList.querySelectorAll(".announcement-delete-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const selected = allAnnouncements.find((item) => item.id === button.dataset.announcementId);
        if (!selected) {
          return;
        }
        showConfirmationDialog(
          `Delete announcement "${selected.title}"?`,
          async () => {
            await deleteAnnouncement(selected.id);
          }
        );
      });
    });
  }

  async function refreshAnnouncementManagerList() {
    if (!currentUser) {
      return;
    }
    try {
      allAnnouncements = await fetchAnnouncements(false);
      renderAnnouncementList();
    } catch (error) {
      showAnnouncementModalMessage("Unable to load announcements. Please try again.", "error");
      console.error(error);
    }
  }

  function openAnnouncementModal() {
    if (!currentUser) {
      showMessage("Sign in to manage announcements.", "info");
      return;
    }
    clearAnnouncementModalMessage();
    resetAnnouncementForm();
    refreshAnnouncementManagerList();
    announcementModal.classList.remove("hidden");
    setTimeout(() => announcementModal.classList.add("show"), 10);
  }

  function closeAnnouncementModalHandler() {
    announcementModal.classList.remove("show");
    setTimeout(() => {
      announcementModal.classList.add("hidden");
      resetAnnouncementForm();
      clearAnnouncementModalMessage();
    }, 300);
  }

  async function deleteAnnouncement(announcementId) {
    if (!currentUser) {
      return;
    }
    try {
      const response = await fetch(
        `/announcements/${encodeURIComponent(announcementId)}?teacher_username=${encodeURIComponent(currentUser.username)}`,
        { method: "DELETE" }
      );
      const payload = await response.json();
      if (!response.ok) {
        showAnnouncementModalMessage(payload.detail || "Delete failed.", "error");
        return;
      }

      showAnnouncementModalMessage("Announcement deleted.", "success");
      await refreshAnnouncementManagerList();
      await refreshPublicAnnouncements();
    } catch (error) {
      showAnnouncementModalMessage("Delete failed. Please try again.", "error");
      console.error(error);
    }
  }

  announcementForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentUser) {
      showAnnouncementModalMessage("Sign in to manage announcements.", "error");
      return;
    }

    const startDate = announcementStartDateInput.value || null;
    const expirationDate = announcementExpirationDateInput.value;
    if (!expirationDate) {
      showAnnouncementModalMessage("Expiration date is required.", "error");
      return;
    }
    if (startDate && startDate > expirationDate) {
      showAnnouncementModalMessage("Start date must be before or equal to expiration date.", "error");
      return;
    }

    const payload = {
      title: announcementTitleInput.value.trim(),
      message: announcementMessageInput.value.trim(),
      start_date: startDate,
      expiration_date: expirationDate,
    };

    if (!payload.title || !payload.message) {
      showAnnouncementModalMessage("Title and message are required.", "error");
      return;
    }

    const existingId = announcementIdInput.value;
    const isEditing = Boolean(existingId);
    const path = isEditing ? `/announcements/${encodeURIComponent(existingId)}` : "/announcements";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(
        `${path}?teacher_username=${encodeURIComponent(currentUser.username)}`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (!response.ok) {
        showAnnouncementModalMessage(result.detail || "Unable to save announcement.", "error");
        return;
      }

      showAnnouncementModalMessage(
        isEditing ? "Announcement updated successfully." : "Announcement created successfully.",
        "success"
      );
      resetAnnouncementForm();
      await refreshAnnouncementManagerList();
      await refreshPublicAnnouncements();
    } catch (error) {
      showAnnouncementModalMessage("Unable to save announcement. Please try again.", "error");
      console.error(error);
    }
  });

  announcementCancelEditButton.addEventListener("click", resetAnnouncementForm);
  manageAnnouncementsButton.addEventListener("click", openAnnouncementModal);
  closeAnnouncementModal.addEventListener("click", closeAnnouncementModalHandler);

  window.activityFilters = { setDayFilter, setTimeRangeFilter };

  checkAuthentication();
  initializeFilters();
  fetchActivities();
  refreshPublicAnnouncements();
});
