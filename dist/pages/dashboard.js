// src/pages/dashboard.js

// Example data you were putting in the inline script:
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
  
  /**
   * Initialization function that sets up the dashboard data:
   * stats, event lists, etc.
   */
  export function initDashboard() {
    // Basic stats for dashboard
    document.getElementById('total-revenue').innerText = "8,750";
    document.getElementById('total-events').innerText  = "7";
    document.getElementById('total-rsvps').innerText   = "1,230";
    document.getElementById('followers-count').innerText = "620";
  
    populateEvents();
  }
  
  /**
   * Generate an event card DOM element.
   */
  function createEventCard(event, isOngoing) {
    const card = document.createElement('div');
    card.classList.add('dynamic-event-card');
  
    let content = `
      <h3>${event.name} - <span class="event-type">${event.eventType}</span></h3>
      <p><strong>Venue:</strong> ${event.venue}</p>
      <p><strong>Address:</strong> ${event.address}</p>
      <p><strong>Start Time:</strong> ${event.startTime}</p>
      <p><strong>End Time:</strong> ${event.endTime}</p>
      <p><strong>Total RSVPs:</strong> ${event.totalRSVP}</p>
      <p><strong>Gender (RSVPs):</strong> M: ${event.genderRSVP.malePct}%, F: ${event.genderRSVP.femalePct}%</p>
    `;
  
    if (isOngoing) {
      // Extra details for ongoing events
      content += `
        <p><strong>Currently at Event:</strong> ${event.currentlyAtEvent}</p>
        <p><strong>Gender (At Event):</strong> 
           M: ${event.genderAtEvent.malePct}%, 
           F: ${event.genderAtEvent.femalePct}%
        </p>
      `;
    }
  
    card.innerHTML = content;
    return card;
  }
  
  /**
   * Renders both ongoing and upcoming events.
   */
  function populateEvents() {
    const ongoingList = document.getElementById('ongoing-events-list');
    const upcomingList = document.getElementById('upcoming-events-list');
  
    // Ongoing
    if (ongoingEvents.length === 0) {
      ongoingList.innerHTML = `<p>No ongoing events at the moment.</p>`;
    } else {
      ongoingEvents.forEach(evt => {
        ongoingList.appendChild(createEventCard(evt, true));
      });
    }
  
    // Upcoming
    if (upcomingEvents.length === 0) {
      upcomingList.innerHTML = `<p>No upcoming events.
        <a href="createevent.html" class="hyperlink">Create an event</a></p>`;
    } else {
      upcomingEvents.forEach(evt => {
        upcomingList.appendChild(createEventCard(evt, false));
      });
    }
  }
  