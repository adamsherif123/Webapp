// src/pages/dashboard.js

import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

// Example data if you want to keep them
const ongoingEvents = [];

const upcomingEvents = [];

export function initDashboard() {
  // Set the static stats except for total events:
  document.getElementById('total-revenue').innerText = "placeholder";
  // Instead of showing "0" for total-events, show "..." while loading
  document.getElementById('total-events').innerText  = "...";
  document.getElementById('total-rsvps').innerText   = "...";
  document.getElementById('followers-count').innerText = "placeholder";

  // Show "Loading..." initially for ongoing events
  const ongoingList = document.getElementById('ongoing-events-list');
  ongoingList.innerHTML = `<p>Loading your ongoing events...</p>`;

  // Also handle auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // If user logs out or there's no user, set it to 0 or hide it
      document.getElementById('total-events').innerText = "0";

      // Show “no ongoing events”
      ongoingList.innerHTML = `<p>No ongoing events at the moment. 
        <a href="createevent.html" class="hyperlink">Create one!</a></p>`;
      // Could also handle upcoming events similarly
      return;
    }

    // We have a user => fetch real total events
    fetchRealTotalEvents(user.uid);
    fetchLifetimeRsvpCount(user.uid)


    try {
      // (A) Query all events created by this user
      const q = query(
        collection(db, 'publicEvents'),
        where('createdBy', '==', user.uid)
      );
      const snapshot = await getDocs(q);

      // (B) Convert doc data to array, **including docSnap.id**:
      const allUserEvents = [];
      snapshot.forEach(docSnap => {
        allUserEvents.push({
          id: docSnap.id,     // store the Firestore doc ID
          ...docSnap.data()
        });
      });

      // (C) Filter to find "ongoing" => startTime <= now <= endTime
      const now = new Date();
      const ongoingEvents = allUserEvents.filter(evt => {
        let start;
        let end;

        // Convert Firestore Timestamp or parse as Date
        if (evt.startTime && typeof evt.startTime.toDate === 'function') {
          start = evt.startTime.toDate();
        } else {
          start = new Date(evt.startTime);
        }

        if (evt.endTime && typeof evt.endTime.toDate === 'function') {
          end = evt.endTime.toDate();
        } else {
          end = new Date(evt.endTime);
        }

        return start <= now && now <= end;
      });

      // (C) Filter to find "upcoming" => now < startTime
      const upcomingEvents = allUserEvents.filter(evt => {
        let start;
        if (evt.startTime && typeof evt.startTime.toDate === 'function') {
          start = evt.startTime.toDate();
        } else {
          start = new Date(evt.startTime);
        }
        return now < start;
      });

      // (D) Render the ongoing events
      renderOngoingEvents(ongoingEvents);

      // (D) Render the upcoming events
      renderUpcomingEvents(upcomingEvents);

    } catch (error) {
      console.error('Error fetching user events:', error);
      ongoingList.innerHTML = `<p>Error loading events. Please try again later.</p>`;
      // If you have an #upcoming-events-list, also handle it there:
      const upcomingList = document.getElementById('upcoming-events-list');
      if (upcomingList) {
        upcomingList.innerHTML = `<p>Error loading events. Please try again later.</p>`;
      }
    }

  });

  populateEvents();
}

/**
 * Actually fetch the real total events for the given user ID
 */
async function fetchRealTotalEvents(userUid) {
  try {
    const eventsRef = collection(db, 'publicEvents');
    const q = query(eventsRef, where('createdBy', '==', userUid));
    const querySnapshot = await getDocs(q);
    const totalEvents   = querySnapshot.size;

    // Set the real count
    document.getElementById('total-events').innerText = totalEvents;
  } catch (error) {
    console.error('Error fetching user events:', error);
    document.getElementById('total-events').innerText = "N/A";
  }
}

async function fetchLifetimeRsvpCount(userUid) {
  try {
    const eventsRef = collection(db, 'publicEvents');
    const q = query(eventsRef, where('createdBy', '==', userUid));
    const querySnapshot = await getDocs(q);
    
    let totalRsvpCount = 0;
    
    // Iterate over each event document
    const promises = querySnapshot.docs.map(async (eventDoc) => {
      // Reference to the "rsvped-users" subcollection for the event
      const rsvpCollectionRef = collection(eventDoc.ref, 'rsvped-users');
      // Fetch the documents in the subcollection
      const rsvpSnapshot = await getDocs(rsvpCollectionRef);
      // Increment the total count by the number of RSVP documents
      totalRsvpCount += rsvpSnapshot.size;
    });
    
    // Wait for all subcollection queries to finish
    await Promise.all(promises);
    
    // Display the aggregated count of rsvped users
    document.getElementById('total-rsvps').innerText = totalRsvpCount;
  } catch (error) {
    console.error('Error fetching user events:', error);
    document.getElementById('total-rsvps').innerText = "N/A";
  }
}


/**
 * Renders an array of "ongoing" events into #ongoing-events-list
 */
function renderOngoingEvents(ongoingEvents) {
  const ongoingList = document.getElementById('ongoing-events-list');
  if (!ongoingEvents || ongoingEvents.length === 0) {
    ongoingList.innerHTML = `<p>No ongoing events at the moment. 
      <a href="createevent.html" class="hyperlink">Create one!</a></p>`;
    return;
  }

  // Clear existing
  ongoingList.innerHTML = '';
  // Render each ongoing event
  ongoingEvents.forEach(evt => {
    ongoingList.appendChild(createEventCard(evt, true));
  });
}

/**
 * Renders an array of "upcoming" events into #upcoming-events-list
 */
function renderUpcomingEvents(upcomingEvents) {
  const upcomingList = document.getElementById('upcoming-events-list');
  if (!upcomingEvents || upcomingEvents.length === 0) {
    upcomingList.innerHTML = `<p>You have no upcoming events. 
      <a href="createevent.html" class="hyperlink">Create one!</a></p>`;
    return;
  }

  // Clear existing
  upcomingList.innerHTML = '';
  // Render each event
  upcomingEvents.forEach(evt => {
    upcomingList.appendChild(createEventCard(evt, false));
  });
}

/**
 * Populate Ongoing/Upcoming from your sample arrays
 */
function populateEvents() {
  const ongoingList = document.getElementById('ongoing-events-list');
  const upcomingList = document.getElementById('upcoming-events-list');

  if (!ongoingEvents || ongoingEvents.length === 0) {
    ongoingList.innerHTML = `<p>No ongoing events at the moment.</p>`;
  } else {
    ongoingEvents.forEach(evt => {
      ongoingList.appendChild(createEventCard(evt, true));
    });
  }

  if (!upcomingEvents || upcomingEvents.length === 0) {
    upcomingList.innerHTML = `<p>No upcoming events.
      <a href="createevent.html" class="hyperlink">Create an event</a></p>`;
  } else {
    upcomingEvents.forEach(evt => {
      upcomingList.appendChild(createEventCard(evt, false));
    });
  }
}

/**
 * Safely format a Timestamp object or fallback to a string parse
 */
function formatTimestampOrString(value) {
  if (!value) return "N/A";

  // If it's a Firestore Timestamp object, use .toDate().toLocaleString()
  if (typeof value.toDate === 'function') {
    const dateObj = value.toDate();
    return dateObj.toLocaleString();
  }

  // Otherwise, assume it's a string parseable by Date
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

// distance from user to event
/**
 * Returns the distance in meters between two lat/lng points using Haversine formula
 */
function getDistanceInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // radius of Earth in meters
  const toRad = (val) => (val * Math.PI) / 180;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in meters
}

/**
 * For an ongoing event, compute how many users are physically at the event location.
 * @param {Object} event - The event object (with .id, .latitude, .longitude)
 * @returns {Promise<{count: number, male: number, female: number}>}
 */
async function fetchUsersCurrentlyAtEvent(event) {
  // Safety checks
  if (!event || !event.id || !event.latitude || !event.longitude) {
    return { count: 0, male: 0, female: 0 };
  }

  const thresholdMeters = 100; // "Building width" threshold
  let count = 0;
  let male = 0, female = 0;

  try {
    // 1) Get the RSVP subcollection
    const rsvpCollectionRef = collection(db, 'publicEvents', event.id, 'rsvped-users');
    const rsvpSnapshot = await getDocs(rsvpCollectionRef);

    // 2) For each RSVP doc, fetch the user from "users" collection
    const tasks = rsvpSnapshot.docs.map(async (docSnap) => {
      const userId = docSnap.id;
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const userData = userSnap.data();
      if (!userData.latitude || !userData.longitude) return; // skip if no location

      // 3) Calculate distance
      const distance = getDistanceInMeters(
        event.latitude,
        event.longitude,
        userData.latitude,
        userData.longitude
      );

      // 4) If within threshold, they are "at the event"
      if (distance <= thresholdMeters) {
        count++;
        if (userData.gender === 'Male')   male++;
        if (userData.gender === 'Female') female++;
        // Could handle other / non-binary if you store that
      }
    });

    // Wait for all user location fetches
    await Promise.all(tasks);
  } catch (err) {
    console.error("Error fetching 'currently at event' data:", err);
  }

  return { count, male, female };
}



/**
 * Build an event card, using Firestore doc ID for the address element ID.
 */
function createEventCard(event, isOngoing) {
  const card = document.createElement('div');
  card.classList.add('dynamic-event-card');

  let imageTag = event.imageUrl
    ? `<img src="${event.imageUrl}" alt="Event Icon" class="event-icon" />`
    : '';

  const headerHTML = `
    <div class="event-card-header">
      ${imageTag}
      <h3>${event.eventName} - <span class="event-type">${event.eventType}</span></h3>
    </div>
  `;

  let infoContent = `
    <h4>Details</h4>
    <a href="edit-event.html" class="hyperlink">Edit Event</a>
  `;
  if (event.venueName) {
    infoContent += `<p><strong>Venue:</strong> ${event.venueName}</p>`;
  }

  const uniqueId = event.id
    ? event.id
    : `sample-${(event.eventName || 'untitled').replace(/\W+/g, '-')}`;

  infoContent += `
    <p id="address-${uniqueId}"><strong>Address:</strong> Loading...</p>
    <p><strong>Start Time:</strong> ${formatTimestampOrString(event.startTime)}</p>
    <p><strong>End Time:</strong> ${formatTimestampOrString(event.endTime)}</p>
  `;

  let statsContent = `
    <h4>Stats</h4>
    <p><strong>Total RSVPs:</strong> <span id="rsvp-count-${uniqueId}">Loading...</span></p>
    <p><strong> Gender Breakdown:</strong> <span id="gender-ratio-${uniqueId}">Loading...</span></p>
  `;

  if (isOngoing) {
    statsContent += `
      <p><strong>Currently at Event:</strong> 
        <span id="live-count-${uniqueId}">Loading...</span>
      </p>
      <p><strong>Gender (At Event):</strong> 
        <span id="live-gender-${uniqueId}">Loading...</span>
      </p>
    `;
  }

  card.innerHTML = `${headerHTML}
    <div class="event-info">${infoContent}</div>
    <div class="event-stats">${statsContent}</div>
  `;

  // Handle Address
  const addressEl = card.querySelector(`#address-${uniqueId}`);
  if (event.location) {
    addressEl.innerHTML = `<strong>Address:</strong> ${event.location}`;
  } else if (event.latitude && event.longitude) {
    reverseGeocode(event.latitude, event.longitude)
      .then(formattedAddr => addressEl.innerHTML = `<strong>Address:</strong> ${formattedAddr}`)
      .catch(() => addressEl.innerHTML = `<strong>Address:</strong> (Could not fetch)`);
  } else {
    addressEl.innerHTML = `<strong>Address:</strong> Not available`;
  }

  // Fetch RSVP count and update UI
  const rsvpEl = card.querySelector(`#rsvp-count-${uniqueId}`);
  if (event.id) {
    // Fetch total RSVP count (already in your code)
    fetchRsvpCount(event.id)
    .then(count => {
      rsvpEl.innerText = count;
    })
    .catch(() => {
      rsvpEl.innerText = "N/A";
    });

    // Now fetch the gender ratio
    const genderRatioEl = card.querySelector(`#gender-ratio-${uniqueId}`);
    fetchRsvpGenderRatio(event.id)
    .then(({ maleCount, femaleCount }) => {
      // For example: "5 : 3"
      genderRatioEl.innerText = `${maleCount} (M) : ${femaleCount} (F)`;
    })
    .catch(() => {
      genderRatioEl.innerText = "N/A";
    });
    
    // Make the RSVP element clickable for showing the modal
    rsvpEl.style.cursor = 'pointer';
    rsvpEl.addEventListener('click', () => {
      showEventRsvpModal(event.id);
    });
  } else {
    rsvpEl.innerText = "N/A";
  }

  // If it’s ongoing, fetch the "at event" count
  if (isOngoing && event.latitude && event.longitude) {
    fetchUsersCurrentlyAtEvent(event).then(({ count, male, female }) => {
      // Update the DOM
      const liveCountEl = card.querySelector(`#live-count-${uniqueId}`);
      const liveGenderEl = card.querySelector(`#live-gender-${uniqueId}`);

      if (liveCountEl)   liveCountEl.innerText = count.toString();
      if (liveGenderEl)  liveGenderEl.innerText = `${male} (M) : ${female} (F)`;
    });
  }


  return card;
}

async function fetchRsvpCount(eventId) {
  try {
    const rsvpCollectionRef = collection(db, 'publicEvents', eventId, 'rsvped-users');
    const rsvpSnapshot = await getDocs(rsvpCollectionRef);
    return rsvpSnapshot.size; // Number of RSVP documents
  } catch (error) {
    console.error(`Error fetching RSVPs for event ${eventId}:`, error);
    return "N/A";
  }
}

// gender breakdown
async function fetchRsvpGenderRatio(eventId) {
  try {
    const rsvpCollectionRef = collection(db, 'publicEvents', eventId, 'rsvped-users');
    const rsvpSnapshot = await getDocs(rsvpCollectionRef);

    let maleCount   = 0;
    let femaleCount = 0;
    // Optional: handle non-binary/other. For simplicity, ignoring here:
    // let otherCount = 0;

    // For each RSVP doc, the doc ID is the user’s UID:
    const fetches = rsvpSnapshot.docs.map(async (docSnap) => {
      const userId = docSnap.id;
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const gender   = userData.gender;
        if (gender === 'Male')   maleCount++;
        if (gender === 'Female') femaleCount++;
        // else otherCount++;
      }
    });

    // Wait for all user fetches
    await Promise.all(fetches);

    return { maleCount, femaleCount };
  } catch (error) {
    console.error(`Error fetching gender ratio for event ${eventId}:`, error);
    return { maleCount: 0, femaleCount: 0 };
  }
}

/**
 * Reverse‐geocode lat/lng into a string address (uses Google Maps JavaScript API).
 */
function reverseGeocode(lat, lng) {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(status);
      }
    });
  });
}

async function showEventRsvpModal(eventId) {
  // Create an overlay that covers the entire screen
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

  // Create the modal container
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    width: 80%;
    max-width: 500px;
    max-height: 80%;
    overflow-y: auto;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
  `;

  // Add a title to the modal
  const title = document.createElement('h2');
  title.innerText = `RSVP List for Event`;
  modalContent.appendChild(title);

  // Fetch the RSVP subcollection for this event.
  const rsvpCollectionRef = collection(db, 'publicEvents', eventId, 'rsvped-users');
  let rsvpSnapshot;
  try {
    rsvpSnapshot = await getDocs(rsvpCollectionRef);
  } catch (error) {
    console.error(`Error fetching RSVPs for event ${eventId}:`, error);
    const errorMsg = document.createElement('p');
    errorMsg.innerText = 'Error loading RSVP list.';
    modalContent.appendChild(errorMsg);
  }

  // Extract user IDs from the RSVP documents (assumes the doc ID is the user ID)
  const userIds = rsvpSnapshot ? rsvpSnapshot.docs.map(doc => doc.id) : [];

  // Fetch details for each user from the "users" collection
  const userPromises = userIds.map(async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        return { id: userId, ...userDocSnap.data() };
      }
    } catch (error) {
      console.error(`Error fetching user ${userId} details:`, error);
    }
    return null;
  });

  const users = (await Promise.all(userPromises)).filter(user => user != null);

  // Create a container for the list of users
  const userList = document.createElement('ul');
  userList.style.listStyle = 'none';
  userList.style.padding = '0';

  if (users.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.innerText = 'No RSVPs yet.';
    modalContent.appendChild(emptyMsg);
  } else {
    // For each user, create a list item with their profile image, full name, and username
    users.forEach(user => {
      const listItem = document.createElement('li');
      listItem.style.display = 'flex';
      listItem.style.alignItems = 'center';
      listItem.style.marginBottom = '10px';

      // If a profile image is available, display it
      if (user.profileImageUrl) {
        const img = document.createElement('img');
        img.src = user.profileImageUrl;
        img.alt = user.fullName || 'Profile Image';
        img.style.width = '40px';
        img.style.height = '40px';
        img.style.borderRadius = '50%';
        img.style.marginRight = '10px';
        listItem.appendChild(img);
      }

      // Create a container for the user's text details
      const userDetails = document.createElement('div');

      // Display the user's full name
      const nameEl = document.createElement('p');
      nameEl.style.margin = '0';
      nameEl.style.fontWeight = 'bold';
      nameEl.innerText = user.fullName || 'Unknown Name';

      // Display the user's username (if available)
      const usernameEl = document.createElement('p');
      usernameEl.style.margin = '0';
      usernameEl.style.fontSize = '0.9em';
      usernameEl.style.color = '#666';
      usernameEl.innerText = user.username ? `@${user.username}` : '';

      userDetails.appendChild(nameEl);
      userDetails.appendChild(usernameEl);
      listItem.appendChild(userDetails);

      userList.appendChild(listItem);
    });
    modalContent.appendChild(userList);
  }

  // Create the dismiss button
  const dismissButton = document.createElement('button');
  dismissButton.innerText = 'Dismiss';
  dismissButton.style.marginTop = '20px';
  dismissButton.addEventListener('click', () => {
    document.body.removeChild(modalOverlay);
  });
  modalContent.appendChild(dismissButton);

  modalOverlay.appendChild(modalContent);
  document.body.appendChild(modalOverlay);
}