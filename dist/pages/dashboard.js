// src/pages/dashboard.js

import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

// Example data if you want to keep them
const ongoingEvents = [
  {
    // NOTICE: no Firestore ID for these sample events,
    // so we'll generate a fallback ID in createEventCard().
    eventName: "Late Summer Bash",
    eventType: "Party",
    venueName: "Rooftop Lounge",
    location: "456 Skyline Dr",
    startTime: "2023-08-25 18:00",
    endTime: "2023-08-25 23:00",
    totalRSVP: 75,
    genderRSVP: { malePct: 66.7, femalePct: 33.3 },
    currentlyAtEvent: 45,
    genderAtEvent: { malePct: 60, femalePct: 40 }
  }
];

const upcomingEvents = [
  {
    eventName: "Campus Kickoff",
    eventType: "College Greek Life Party",
    venueName: "Alpha Beta House",
    location: "University District",
    startTime: "2023-09-01 20:00",
    endTime: "2023-09-02 02:00",
    totalRSVP: 40,
    genderRSVP: { malePct: 50, femalePct: 50 }
  }
];

export function initDashboard() {
  // Set the static stats except for total events:
  document.getElementById('total-revenue').innerText = "placeholder";
  // Instead of showing "0" for total-events, show "..." while loading
  document.getElementById('total-events').innerText  = "...";
  document.getElementById('total-rsvps').innerText   = "placeholder";
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

    try {
      // (A) Query all events created by this user
      const q = query(
        collection(db, 'events'),
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

  // 3) Populate Ongoing & Upcoming from your sample arrays, if you want:
  populateEvents();
}

/**
 * Actually fetch the real total events for the given user ID
 */
async function fetchRealTotalEvents(userUid) {
  try {
    const eventsRef = collection(db, 'events');
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

/**
 * Build an event card, using Firestore doc ID for the address element ID.
 */
function createEventCard(event, isOngoing) {
  const card = document.createElement('div');
  card.classList.add('dynamic-event-card');

  // Build small “header” with optional image
  let imageTag = '';
  if (event.imageUrl) {
    imageTag = `<img src="${event.imageUrl}" alt="Event Icon" class="event-icon" />`;
  }

  const headerHTML = `
    <div class="event-card-header">
      ${imageTag}
      <h3>${event.eventName} - <span class="event-type">${event.eventType}</span></h3>
    </div>
  `;

  // The “Details” section
  let infoContent = `
    <h4>Details</h4>
    <a href="edit-event.html" class="hyperlink">Edit Event</a>
  `;
  if (event.venueName) {
    infoContent += `<p><strong>Venue:</strong> ${event.venueName}</p>`;
  }

  // Use the doc ID if present; else generate a fallback from eventName
  const uniqueId = event.id 
    ? event.id
    : `sample-${(event.eventName || 'untitled').replace(/\W+/g, '-')}`;

  infoContent += `
    <p id="address-${uniqueId}">
      <strong>Address:</strong> Loading...
    </p>
    <p><strong>Start Time:</strong> ${formatTimestampOrString(event.startTime)}</p>
    <p><strong>End Time:</strong>   ${formatTimestampOrString(event.endTime)}</p>
  `;

  // Stats (placeholder)
  let statsContent = `
    <h4>Stats</h4>
    <p><strong>Total RSVPs:</strong> ***PLACEHOLDER***</p>
    <p><strong>Gender (RSVPs):</strong> ***PLACEHOLDER***</p>
  `;
  // If ongoing, we show more stats
  if (isOngoing) {
    statsContent += `
      <p><strong>Currently at Event:</strong> ***PLACEHOLDER***</p>
      <p><strong>Gender (At Event):</strong> ***PLACEHOLDER***</p>
    `;
  }

  // Combine everything
  card.innerHTML = `
    ${headerHTML}
    <div class="event-info">
      ${infoContent}
    </div>
    <div class="event-stats">
      ${statsContent}
    </div>
  `;

  // Now handle “Address:” logic
  const addressEl = card.querySelector(`#address-${uniqueId}`);

  // 1) If Firestore has a string `event.location`, just show it
  if (event.location) {
    addressEl.innerHTML = `<strong>Address:</strong> ${event.location}`;
  }
  // 2) Otherwise, if we have lat/lng => reverse geocode
  else if (event.latitude && event.longitude) {
    reverseGeocode(event.latitude, event.longitude)
      .then(formattedAddr => {
        addressEl.innerHTML = `<strong>Address:</strong> ${formattedAddr}`;
      })
      .catch(err => {
        addressEl.innerHTML = `<strong>Address:</strong> (Could not fetch)`;
        console.error('Reverse geocode error:', err);
      });
  }
  // 3) Fallback
  else {
    addressEl.innerHTML = `<strong>Address:</strong> Not available`;
  }

  return card;
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
