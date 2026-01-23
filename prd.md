

📘 Product Requirements Document (PRD)

Project Name: Stillness

A spatial, immersive travel experience designed to evoke calm, curiosity, and trust.


---

1. Executive Summary & Product Overview

1.1 Product Vision

Create a calm, immersive, Three.js-based travel exploration web application that replaces traditional page-based navigation with a spatial, meditative experience, allowing users to gently explore destinations through light, motion, and depth rather than buttons and dashboards.

Success means users leave the experience feeling calmer than when they arrived.


---

1.2 Problem Statement

Current travel websites and apps suffer from:

Cognitive overload (too many cards, filters, CTAs)

Aggressive sales-driven UI patterns

Fragmented experiences across pages and modals

Lack of emotional connection to destinations


Users researching travel often feel more stressed, not inspired.

There is no widely adopted product that treats travel discovery as a calm, sensory experience rather than an e-commerce funnel.


---

1.3 Target Users

Persona	Description

Mindful Explorer	25–45, urban professional, values calm UX, explores travel slowly
Creative Professional	Designer / developer / artist seeking inspiration
Burned-out Planner	Users overwhelmed by traditional travel apps


Technical Proficiency: Medium
Devices: Desktop-first, tablet supported, limited mobile support (phase 1)


---

1.4 Success Metrics (KPIs)

Metric	Target

Average session duration	≥ 3 minutes
Bounce rate	≤ 30%
Repeat visits (30 days)	≥ 25%
Motion-induced drop-offs	< 5%
Lighthouse performance score	≥ 85



---

1.5 Timeline & Milestones

Phase	Duration

Concept & UX definition	1 week
Core Three.js scene	2 weeks
Interaction & micro-animations	2 weeks
Performance & accessibility pass	1 week
Beta release	Week 6



---

2. Functional Requirements

2.1 User Stories

1. As a user, I want to enter the experience instantly so that I feel no friction.


2. As a user, I want to explore destinations spatially so that discovery feels natural.


3. As a user, I want subtle feedback to my actions so that I feel in control.


4. As a user, I want minimal UI so that nothing distracts me.




---

2.2 Feature Specifications

Feature 1: Bio-Feedback Atmosphere (Resonance System)

Description
The application's atmosphere dynamically adapts to the user's interaction patterns, creating a bio-feedback loop that encourages and rewards calm exploration.

Flow

1. User interacts with the scene (scroll, keyboard navigation).


2. High-intensity interactions ("stress") are detected.


3. The environment responds in real-time: fog density increases, and light intensity decreases, creating a more focused, intimate atmosphere.


4. As interactions become calmer, "stress" decays, and the environment "opens up," becoming brighter and more expansive.


Business Logic

This system is always active and requires no user configuration.

It directly supports the core product vision of leaving users feeling calmer.


---

Feature 2: Ambient Landing Experience

Description
Users land directly into a living Three.js scene.

Flow

1. App loads


2. Scene fades in from black (800–1200ms)


3. Ambient motion begins automatically



Inputs

Scroll

Mouse move / trackpad

Touch (basic)


Outputs

Camera parallax

Light shift

Slow object rotation


Edge Cases

Low-power devices → reduced motion mode

WebGL unsupported → fallback static page



---

Feature 2: Spatial Destination Exploration

Description
Destinations are represented as floating, calm 3D objects.

Flow

1. User scrolls → camera gently advances


2. Destination comes into focus


3. Name appears softly


4. User pauses → detail layer fades in



Business Logic

Only one destination may be “active” at a time

UI auto-hides after 2 seconds of inactivity


Error Handling

Asset load failure → graceful placeholder geometry



---

Feature 3: Invisible Navigation Layer

Description
Navigation is contextual and ephemeral.

Rules

No persistent navbar

Navigation hints fade in only when needed

Keyboard navigation supported



---

2.3 UI / UX Requirements

Layout

Full-screen canvas

Zero visible borders

Typography overlays only when contextually required


Navigation

Scroll = forward/back

Hover = reveal

Click = deepen focus


Accessibility

WCAG 2.1 AA

Reduced motion toggle (OS-level detection)

Keyboard traversal

Screen reader fallback descriptions



---

3. Technical Requirements

3.1 System Architecture

High-Level Components

Web Client (React)

Three.js Scene Engine

Asset Loader

State Manager

Analytics Module


Data Flow

1. App initializes


2. Assets lazy-load


3. Scene renders


4. User input modifies camera + state




---

3.2 Technology Stack

Layer	Tech

Frontend	React 18
3D Engine	Three.js r160
State	Zustand
Styling	CSS + custom shaders
Build	Vite
Hosting	Vercel
Analytics	PostHog



---

3.3 Performance Requirements

First render ≤ 2.5s (desktop)

Frame rate ≥ 50 FPS

Asset bundle ≤ 3MB initial load

Progressive enhancement required



---

3.4 Security & Privacy

No authentication (v1)

No PII stored

Analytics anonymized

GDPR compliant



---

4. Database Design

Phase 1: Static JSON
Phase 2: CMS-backed (future)

Example Destination Schema:

{
  "id": "string",
  "name": "string",
  "coordinates": [x, y, z],
  "ambientColor": "#hex",
  "description": "string"
}


---

5. API Specifications

Phase 1: No external API
Phase 2 (Planned):

/destinations

/ambience-config


REST, JSON-only, versioned.


---

6. Development Guidelines

6.1 Coding Standards

Functional components only

No inline magic numbers

Explicit animation timing constants



---

6.2 Testing Requirements

Type	Requirement

Unit	≥ 80%
Integration	Scene init + teardown
E2E	Scroll → focus → exit
Performance	FPS monitoring



---

6.3 Version Control

GitFlow

Feature branches

Mandatory PR review



---

7. Deployment & Infrastructure

Environments: dev / prod

CI via GitHub Actions

Rollback via Vercel instant revert



---

8. Quality Assurance

Release Gates

No console errors

FPS ≥ target

Reduced motion verified

Lighthouse ≥ 85



---

9. Risk Assessment & Mitigation

Risk	Mitigation

Motion sickness	Reduced motion mode
GPU limitations	Adaptive quality
Overengineering	Strict scope control



---

10. Appendices

10.1 Glossary

Parallax: Apparent depth via relative motion

Ambient motion: Continuous, low-attention animation

Spatial UI: Interface embedded in 3D space



---

10.2 Assumptions

Desktop-first usage

Modern browser support

No monetization in v1



---

10.3 Out of Scope

Bookings

Pricing

User accounts

Ads



---

If you want next, I can:

Convert this PRD → Jira epics & tickets

Produce a Three.js scene graph

Generate a technical spike plan

Write a developer onboarding doc


Just point the compass 🧭
