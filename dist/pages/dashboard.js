// src/pages/dashboard.js

import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { showAlert } from '../utils/alerts.js';

// Example data if you want to keep them
const ongoingEvents = [
  {
    name: "Late Summer Bash",
    eventType: "Party",
    venue: "Rooftop Lounge",
    address: "456 Skyline Dr",
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
    name: "Campus Kickoff",
    eventType: "College Greek Life Party",
    venue: "Alpha Beta House",
    address: "University District",
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

  // 2) Start with "Loading..." or "No events yet" in ongoing
  const ongoingList = document.getElementById('ongoing-events-list');
  ongoingList.innerHTML = `<p>Loading your ongoing events...</p>`;

  // 2) Also listen for user changes (login/logout)
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // If user logs out or there's no user, set it to 0 or hide it
      document.getElementById('total-events').innerText = "0";
    } else {
      fetchRealTotalEvents(user.uid);
    }

    if (!user) {
        // Not logged in => no ongoing events
        ongoingList.innerHTML = `<p>No ongoing events at the moment. 
          <a href="createevent.html" class="hyperlink">Create one!</a></p>`;
        return;

        // NOTE: This return is unreachable, but leaving it as in Code #1:
        upcomingList.innerHTML = `<p>You have no upcoming events. 
          <a href="createevent.html" class="hyperlink">Create one!</a></p>`;
        return;
    }

    try {
        // (A) Query all events created by this user
        const q = query(
          collection(db, 'events'),
          where('createdBy', '==', user.uid)
        );
        const snapshot = await getDocs(q);

        // (B) Convert doc data to array
        const allUserEvents = [];
        snapshot.forEach(docSnap => {
          allUserEvents.push(docSnap.data());
        });

        // (C) Filter to find "ongoing" => startTime <= now <= endTime
        const now = new Date();
        const ongoingEvents = allUserEvents.filter(evt => {
            let start;
            let end;

            // 1) Check if `evt.startTime` is a Firestore Timestamp
            if (evt.startTime && typeof evt.startTime.toDate === 'function') {
                // Firestore Timestamp => convert
                start = evt.startTime.toDate();
            } else {
                // Probably a string => parse
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

        // (D) Render the ongoing events or show a "none" message
        renderOngoingEvents(ongoingEvents);

        // (D) Render the upcoming events or show a "none" message
        renderUpcomingEvents(upcomingEvents);

    } catch (error) {
        console.error('Error fetching user events:', error);
        ongoingList.innerHTML = `<p>Error loading events. Please try again later.</p>`;
        upcomingList.innerHTML = `<p>Error loading events. Please try again later.</p>`;
    }

  });

  // 3) Populate Ongoing & Upcoming events
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
    // If error, we can show "N/A" or "Error"
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

// /**
//  * Renders an array of "upcoming" events into #ongoing-events-list
//  */
function renderUpcomingEvents(upcomingEvents) {
    const upcomingList = document.getElementById('upcoming-events-list');
    if (!upcomingEvents || upcomingEvents.length === 0) {
        upcomingList.innerHTML = `<p>You have no upcoming events. 
        <a href="createevent.html" class="hyperlink">Create one!</a></p>`;
      return;
    }
  
    // Clear existing
    upcomingList.innerHTML = '';
    // Render each ongoing event
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

function formatTimestampOrString(value) {
    if (!value) return "N/A";
  
    // If it's a Firestore Timestamp object, use .toDate().toLocaleString()
    if (typeof value.toDate === 'function') {
      const dateObj = value.toDate();
      return dateObj.toLocaleString(); 
    }
  
    // Otherwise, assume it's a string parseable by Date
    // (like "2023-09-12T21:00" from <input type="datetime-local">)
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      // If it failed to parse, just return the raw string
      return value;
    } else {
      return parsed.toLocaleString();
    }
}

/**
 * Create a dynamic event card. Now includes a thumbnail if `event.imageUrl` is present.
 */
function createEventCard(event, isOngoing) {
    const card = document.createElement('div');
    card.classList.add('dynamic-event-card');

    // --- ADDED: If there's an imageUrl, show a small thumbnail
    let imageThumbnail = '';
    if (event.imageUrl) {
      imageThumbnail = `
        <div class="event-card-image">
          <img 
            src="${event.imageUrl}" 
            alt="Event Image" 
            class="event-image-thumbnail"
          />
        </div>
      `;
    }
    // ---

    // First container: event info
    let infoContent = `
        <h4>Details</h4>
        <a href="edit-event.html" class="hyperlink">Edit Event</a> 
    `;
    if (event.venueName) {
      infoContent += `<p><strong>Venue:</strong> ${event.venueName}</p>`;
    }
  
    infoContent += `
      <p><strong>Address:</strong> ${event.location}</p>
      <p><strong>Start Time:</strong> ${formatTimestampOrString(event.startTime)}</p>
      <p><strong>End Time:</strong> ${formatTimestampOrString(event.endTime)}</p>
      <p><strong>Access:</strong> ${event.inviteType}</p>
    `;
  
    if (event.ticketing == 'Yes') {
      infoContent += `
        <p><strong>Ticket Price:</strong> $${event.ticketPrice}</p>
        <p><strong>Capacity:</strong> ${event.capacity}</p>
      `;
    }
  
    // Second container: stats (placeholders or real stats)
    let statsContent = `
      <p><strong>Total RSVPs:</strong> ***PLACEHOLDER***</p>
      <p><strong>Gender (RSVPs):</strong> ***PLACEHOLDER***</p>
    `;
    if (isOngoing) {
      statsContent += `
        <p><strong>Currently at Event:</strong> ***PLACEHOLDER***</p>
        <p><strong>Gender (At Event):</strong> ***PLACEHOLDER***</p>
      `;
    }
  
    // Build final HTML with three sections: optional image, event info, event stats
    card.innerHTML = `
      ${imageThumbnail}
      <div class="event-info">
        <h3>${event.eventName} - <span class="event-type">${event.eventType}</span></h3>
        ${infoContent}
      </div>
      <div class="event-stats">
        <h4>Stats</h4>
        ${statsContent}
      </div>
    `;
  
    return card;
}
