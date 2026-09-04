# JANVAANI — Redefined Product Requirements Document (PRD)

**Version:** 2.0  
**Target:** Smart India Hackathon (SIH) 2026  
**Product Type:** AI-powered civic issue detection, prioritization, response, and resolution platform  
**Primary Domains:** Waste management, waste segregation, illegal dumping, overflowing bins, waterlogging, flooded roads, blocked drains

---

## 1. Product Overview

**JANVAANI** is a citizen-centric civic intelligence platform that allows people to report public problems using photos, videos, live camera input, text, and voice. The system uses computer vision, geospatial intelligence, AI-assisted analysis, and risk scoring to convert individual complaints into actionable civic incidents.

JANVAANI is designed around a complete lifecycle:

> **Report → Detect → Segment → Understand → Cluster → Prioritize → Notify → Act → Verify → Learn → Predict**

The platform should be accessible without public login or registration. Citizens can browse complaints, support existing incidents, view heatmaps, read AI-generated civic updates, and track resolution status.

The system is designed for three operational perspectives:

1. **Citizen:** report, view, support, comment, monitor, and provide feedback.
2. **Municipal Worker / Field Team:** receive prioritized work, navigate to incidents, update status, and submit after-cleanup evidence.
3. **Municipal / Admin Command Center:** monitor critical incidents, hotspots, response performance, SLA breaches, recurring problems, and predictive risk.

---

# 2. Problem Statement

Civic issues such as unsegregated waste, illegal dumping, overflowing bins, blocked drains, and waterlogging are often reported through disconnected channels. Multiple citizens may report the same incident independently, while the most urgent problems may not reach the right municipal team quickly.

JANVAANI addresses this by:

- detecting civic issues from citizen-submitted media,
- segmenting the exact affected region,
- combining duplicate or related reports into a single civic incident,
- analyzing geographic context and nearby important places,
- scoring urgency and public impact,
- automatically elevating rapidly worsening incidents,
- assisting municipal teams with routing and recommended actions,
- verifying cleanup through before/after computer vision,
- exposing transparent status and civic performance information to citizens,
- identifying recurring problem locations and predicting potential hotspots.

---

# 3. Product Vision

> **"See it. Report it. Understand it. Prioritize it. Resolve it. Verify it."**

JANVAANI should become a digital civic intelligence layer between citizens, field workers, and municipal decision-makers.

The platform should not be positioned as only a garbage/waterlogging reporting website. Its differentiated value is the **Responsive Civic AI Engine** that continuously reassesses civic incidents as new evidence arrives.

---

# 4. Core Product Principles

1. **No citizen login required.**
2. **AI assists decisions; it does not replace municipal authority.**
3. **Every critical AI decision should have a human-readable reason.**
4. **Repeated reports should become evidence for one incident rather than unnecessary duplicates.**
5. **Location, time, severity, and public impact matter together.**
6. **Resolved means verified, not simply marked resolved.**
7. **Public transparency should coexist with privacy and data minimization.**
8. **Every feature should support the civic lifecycle instead of adding AI for decoration.**

---

# 5. Target Users

## 5.1 Citizens

- Report civic issues.
- Upload photo/video or use live camera.
- Submit voice complaints.
- Share location.
- Discover nearby municipal bodies.
- Browse public complaints.
- Support existing incidents instead of creating duplicates.
- Like and comment.
- View heatmaps and issue details.
- Track municipal response.
- Review resolved issues.
- Provide feedback.

## 5.2 Municipal Workers / Field Teams

- View assigned incidents.
- See issue evidence and AI analysis.
- Navigate to the incident.
- See priority and reason.
- Update work status.
- Follow recommended action.
- Upload before/after evidence.
- Receive optimized routes.

## 5.3 Municipal/Admin Users

- Monitor critical incidents.
- View live heatmaps.
- Manage incident queues.
- Review AI evidence.
- Assign departments/teams.
- Monitor SLA and escalation.
- Analyze recurring issues.
- Monitor hotspots and predictions.
- Review municipal performance.

---

# 6. Technology Stack

## 6.1 Frontend

### Next.js

Used for:

- Public citizen web application.
- Complaint pages.
- Public complaint feed.
- News/Social section.
- Heatmap interface.
- Resolved issues.
- Municipal/admin dashboard.

### React Native

Used for:

- Citizen mobile app.
- Field worker/mobile operations app.
- Camera capture.
- Location collection.
- Voice complaint capture.
- Notifications.

### Tailwind CSS

Used for:

- Responsive layouts.
- Design system.
- Cards, badges, forms, dashboards.
- Dark/light and themed interfaces.
- Mobile/desktop consistency.

---

## 6.2 AI & Backend

### Python + FastAPI

Used for:

- Backend APIs.
- Media upload processing.
- AI inference services.
- Complaint processing pipeline.
- Risk-score calculation service.
- Incident clustering service.
- Location-intelligence orchestration.
- AI-generated summaries.
- Municipal workflow APIs.

### YOLO26 / YOLO26-Seg

Used for:

- Waste detection.
- Dumping detection.
- Overflowing-bin detection.
- Waterlogging detection.
- Segmentation of the affected region.
- Before/after visual comparison support.

**Important:** JANVAANI must use a segmentation-trained checkpoint for pixel/region segmentation. Detection-only checkpoints provide boxes, not masks.

### RT-DETR

Optional alternative or benchmark model for object detection where useful. The MVP should avoid unnecessary model duplication; YOLO26-Seg should remain the primary model for the first working pipeline unless evaluation shows RT-DETR provides a clear advantage.

### OpenCV

Used for:

- Image preprocessing.
- Frame extraction.
- Mask overlays.
- Video handling.
- Before/after comparison.
- Image quality checks.
- Geometric measurements where applicable.

### XGBoost

Used for:

- Civic priority/risk scoring.
- Hotspot risk prediction.
- Escalation prediction.
- Combining multiple structured signals.

### Whisper

Used for:

- Voice complaint transcription.
- Multilingual speech-to-text pipeline where supported.

### Optional multimodal AI: Gemini 2.5 Flash-Lite

Recommended supplementary model for the project prototype for:

- Complaint summarization.
- Image/context explanation.
- Structured extraction from citizen descriptions.
- AI-generated News/Social descriptions.
- Natural-language explanation of why an incident is high/critical.
- Combining text context with YOLO outputs.

It should **not** replace the trained YOLO segmentation model for the actual pixel-level civic issue segmentation.

---

## 6.3 Data & GIS

### PostgreSQL

Primary relational database for:

- Complaints.
- Civic incidents.
- Users/roles where applicable to internal systems.
- Municipal bodies.
- Departments.
- Assignments.
- Comments.
- Likes/supports.
- Status history.
- Feedback.
- AI results.
- Audit information.

### PostGIS

Used for:

- Coordinates.
- Spatial queries.
- Nearby-facility analysis.
- Incident clustering support.
- Distance calculations.
- Geospatial filtering.
- Municipal jurisdiction lookup.

### H3

Used for:

- Spatial indexing.
- Hotspot aggregation.
- Complaint density.
- Neighborhood-level risk.
- Historical and predictive spatial analysis.

### MapLibre + OpenStreetMap

Used for:

- Interactive issue maps.
- Heatmaps.
- Incident points.
- Nearby places.
- Municipal boundaries.
- Route visualizations.

### Google Maps / Places / location APIs

Optional integration for richer place/context analysis where API access, quota, billing, and terms permit. The architecture should keep the location-provider interface replaceable so that OpenStreetMap/Open data sources can be used where appropriate.

---

## 6.4 Routing & Optimization

### OSRM

Used for:

- Road-network routing.
- Route geometry.
- Distance/duration estimation.
.
### OR-Tools

Used for:

- Multi-stop municipal routing.
- Vehicle/team constraints.
- Workload balancing.
- Priority-aware route planning.

---

## 6.5 Verification, Deployment & Security

### Computer Vision

Used for:

- Before/after cleanup comparison.
- Segmentation-area comparison.
- Resolution evidence checks.

### Docker

Used for:

- Portable deployment.
- Reproducible development environments.
- Separate frontend/backend/AI/database services.

### JWT + HTTPS + RBAC

Used for internal/authorized access:

- Admin.
- Municipal authority.
- Supervisor.
- Field worker.

Citizen-facing public access remains login-free.

---

# 7. High-Level System Architecture

```text
                         JANVAANI
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
   Public Citizen Web                      Mobile Apps
      Next.js + Tailwind                    React Native
         │                                       │
         └───────────────────┬───────────────────┘
                             │
                          FastAPI
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
        YOLO26-Seg        Whisper        Multimodal AI
           │                 │                 │
      Detection +        Voice→Text       Summary/
      Segmentation                         Explanation
           │                 │                 │
           └─────────────────┼─────────────────┘
                             │
                    Incident Intelligence
                             │
       ┌─────────────────────┼─────────────────────┐
       │                     │                     │
  Duplicate/Cluster      Location AI          Civic Context
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             │
                  XGBoost Responsive AI
                             │
               Risk + Impact + Escalation
                             │
             ┌───────────────┼───────────────┐
             │               │               │
          PostGIS            H3          Hotspot Model
             │               │               │
             └───────────────┼───────────────┘
                             │
                         Command Center
                             │
                    OSRM + OR-Tools
                             │
                      Municipal Teams
                             │
                    Before/After CV
                             │
                     Resolution Verify
                             │
                       Historical Data
                             │
                      Future Prediction
```

---

# 8. Main Product Modules

## 8.1 Home / Landing Page

The landing page should communicate JANVAANI's purpose immediately.

Suggested message:

> **JANVAANI — See It. Report It. Resolve It.**

Core entry points:

- Report an issue.
- Explore complaints.
- Explore heatmap.
- Resolved issues.
- News/Social.

---

# 9. Ten Dynamic Visual Themes

The website should have **10 attractive visual themes**, automatically shuffled through a designed transition sequence.

## Waste Themes

1. Waste Segregation.
2. Illegal Dumping.
3. Overflowing Bins.
4. Mixed/Unsegregated Waste.
5. Waste Hotspots.

## Water Themes

6. Waterlogging.
7. Flooded Roads.
8. Blocked Drainage.
9. Standing Water.
10. Waterlogging Hotspots.

### Theme Behavior

- Themes change automatically.
- Shuffle should feel intentional, not random/jarring.
- Waste and water themes should alternate where practical.
- Animations should be smooth and fast.
- Theme should never reduce usability or readability.
- Accessibility mode should be available for users who prefer reduced motion/high contrast.

---

# 10. Report a Complaint

## 10.1 Input Methods

The citizen can provide:

- Photo.
- Video.
- Camera capture.
- Voice complaint.
- Text description.
- Live GPS location.

## 10.2 Complaint Flow

```text
Choose issue
   ↓
Capture / Upload media
   ↓
Capture location
   ↓
Optional voice/text description
   ↓
AI analysis
   ↓
Show detection + segmentation
   ↓
Find nearby authority
   ↓
Create / attach to civic incident
   ↓
Calculate priority
   ↓
Submit
```

## 10.3 Location

Show:

- Current location.
- Issue pin.
- Nearby municipal bodies.
- Approximate distance to authority.
- Relevant nearby facilities.

## 10.4 Pre-submission AI Result

Display:

- Detected issue type.
- AI confidence.
- Segmented affected area.
- Initial severity.
- Warning if evidence confidence is low.

---

# 11. AI Detection & Segmentation

## Goal

Turn the clicked/uploaded media into structured civic evidence.

### Example

```text
Original Photo
      ↓
YOLO26-Seg
      ↓
Objects / Regions
      ↓
Mask Overlay
      ↓
Affected Area Estimate
      ↓
Structured AI Result
```

### Sample result

```json
{
  "issue_type": "waterlogging",
  "confidence": 0.94,
  "severity_initial": "high",
  "detections": [
    {
      "class": "waterlogging",
      "confidence": 0.94,
      "affected_area_estimate": 34.7
    }
  ]
}
```

### UI

Use:

- Original.
- AI Detection.
- Segmentation.

The user should be able to compare them easily.

---

# 12. Civic Incident Engine

This is a core differentiator.

A **complaint** is a citizen submission. A **civic incident** is the underlying real-world issue represented by one or more related complaints.

### Example

```text
Complaint A ─┐
Complaint B ─┼─→ Civic Incident JV-1042
Complaint C ─┤
Complaint D ─┘
```

Instead of treating 4 reports as 4 unrelated issues, JANVAANI creates one incident with multiple evidence/support records.

---

# 13. Duplicate & Related Complaint Detection

The system should use multiple signals:

- Geographic proximity.
- H3 cell proximity.
- Issue type similarity.
- Time window.
- Image similarity where implemented.
- Complaint text similarity.
- YOLO detection similarity.

### Output

```text
23 citizen reports
        ↓
Likely same civic issue
        ↓
Incident JV-1042
```

This prevents unnecessary duplication while preserving citizen evidence.

---

# 14. Citizen Support / Affected Citizen Signal

On an existing incident, citizens can select:

> **I am also affected**

This should increase the incident's community-impact evidence without generating another duplicate complaint.

Example:

> **38 citizens affected**

This is more meaningful than simply showing 38 separate posts.

---

# 15. Responsive Civic AI

The Responsive AI Engine continuously reevaluates the incident as new evidence arrives.

It should answer:

1. What is happening?
2. Where is it happening?
3. How severe is it?
4. How many people may be affected?
5. What important facilities are nearby?
6. Is the problem getting worse?
7. How long has it remained unresolved?
8. Should it be escalated?
9. What action is recommended?

---

# 16. Civic Priority / Risk Scoring

JANVAANI should produce a **0–100 Civic Priority Score**.

Suggested signals:

- AI-detected severity.
- Detection confidence/evidence quality.
- Number of related citizen reports.
- Citizen support count.
- Complaint velocity.
- Affected area.
- Road importance.
- Nearby critical facilities.
- Population exposure where available.
- Duration unresolved.
- Historical recurrence.
- Escalation trend.

### Initial interpretation

| Score | Level |
|---:|---|
| 0–30 | 🟢 Low |
| 31–55 | 🟡 Medium |
| 56–80 | 🟠 High |
| 81–100 | 🔴 Critical |

These boundaries should be configurable and later optimized using data.

---

# 17. Why Is This Critical?

Every High/Critical issue should provide a plain-language explanation.

Example:

> **Critical — 94/100**
>
> - 18 reports in 45 minutes.
> - Main road affected.
> - School within 120 m.
> - Hospital within 480 m.
> - Incident growing rapidly.
> - Unresolved for more than 2 hours.

This is important for explainability and municipal trust.

---

# 18. Complaint Velocity / Escalation

The system should monitor the rate at which new evidence arrives.

### Example

```text
10:00 → 1 report
10:20 → 2 reports
10:40 → 7 reports
11:00 → 18 reports
```

The system should identify this as **rapid escalation**.

A previously medium incident can move to high/critical even if its initial score was low.

---

# 19. Location & Nearby Facility Intelligence

When an issue is reported, JANVAANI should analyze the surrounding area.

Potential context layers:

- Schools.
- Hospitals.
- Clinics.
- Railway stations.
- Bus stops.
- Main roads.
- Bridges.
- Markets.
- Residential clusters.
- Fire stations.
- Police stations.
- Government buildings.
- Drainage-related infrastructure where available.

### Example

```text
Waterlogging
    +
Main road
    +
School 120 m
    +
Hospital 480 m
    +
18 recent reports
    ↓
Critical priority
```

Facility weights should be configurable by municipal policy and should not be presented as universal facts.

---

# 20. Civic Impact Score

In addition to urgency/risk, JANVAANI may maintain a separate **Civic Impact Score**.

It can represent:

- Estimated number of affected people.
- Important facility exposure.
- Traffic significance.
- Geographic spread.
- Duration.

Example:

> **Risk:** 82/100  
> **Civic Impact:** 91/100

This separates “how urgent” from “how broadly impactful.”

---

# 21. Evidence Confidence

AI should report how reliable the current evidence is.

Possible display:

- 🟢 High confidence.
- 🟡 Needs review.
- 🔴 Insufficient evidence.

The evidence score can combine:

- YOLO confidence.
- Image quality.
- Text/image consistency.
- Location consistency.
- Duplicate/report consistency.

Low-confidence incidents should be routed for human review rather than treated as unquestionable truth.

---

# 22. Recurring Problem Detection

JANVAANI should identify locations where similar problems repeatedly occur.

Example:

> **Recurring Waterlogging Location**
>
> 5 similar incidents in the last 90 days.

This enables municipalities to investigate persistent causes rather than repeatedly reacting to individual complaints.

---

# 23. Root-Cause Intelligence

JANVAANI may generate hypotheses such as:

> “Repeated waterlogging is associated with multiple nearby drainage complaints.”

or:

> “Repeated waste accumulation may indicate insufficient collection capacity or recurring dumping at this location.”

These should always be labelled **AI recommendation / hypothesis**, not a confirmed engineering diagnosis.

---

# 24. Predictive Hotspot Intelligence

XGBoost + H3 should eventually predict potential future hotspots.

Potential inputs:

- Historical incidents.
- Complaint density.
- Recent complaint velocity.
- Recurrence frequency.
- Spatial patterns.
- Available rainfall/weather data.
- Drainage-related incidents.
- Road characteristics.

Output:

> 🔮 **Potential Waterlogging Hotspot**
>
> High predicted risk for H3 cell / area.

The system should clearly distinguish **prediction** from **confirmed incident**.

---

# 25. Public Complaint Section

A public feed showing civic incidents.

Each card can contain:

- Issue type.
- AI severity.
- Location.
- Current status.
- Risk score.
- Number of supporting citizens.
- Number of comments.
- Timestamp.
- Small segmented preview.

### Actions

- View details.
- Support.
- Like.
- Comment.
- Share.

---

# 26. Complaint Details Page

Every complaint/incident page should be an **evidence-to-resolution timeline**.

## Required sections

### Header

- Issue title.
- Status.
- Complaint/incident ID.
- Date/time.
- Risk score.

### Original Evidence

- Original image/video.
- Citizen description.
- Timestamp.
.
### AI Detection

- Detected classes.
- Confidence.
- Bounding boxes where applicable.

### AI Segmentation

- Segmented affected region.
- Mask overlay.
- Area estimate where supported.

### AI Summary

Human-readable explanation of the issue.

### Location

- Interactive map.
- Issue pin.
- Nearby facilities.
- Authority information.

### Community Evidence

- Related reports.
- Supporting citizens.
- Likes.
- Comments.
- Complaint velocity.

### Risk & Impact

- Risk score.
- Civic impact score.
- “Why is this critical?” explanation.

### Municipal Action

- Assigned authority.
- Assigned department/team.
- Status.
- Timeline.
- SLA.

### AI Recommendation

Suggested next action, clearly labelled as AI-generated guidance.

### Before/After

- Before image.
- After image.
- AI comparison.
- Resolution confidence.

### Feedback

- Rating.
- Text feedback.

### Share

Shareable civic incident card.

---

# 27. Heatmap

The heatmap should show the geographic concentration of civic incidents.

Use:

- H3 cells.
- PostGIS aggregation.
- MapLibre rendering.

Filter options:

- Waste.
- Waterlogging.
- Critical only.
- Unresolved only.
- Resolved.
- Date range.
- Municipality.

Clicking a hotspot should open:

- Incident count.
- Unresolved count.
- Average risk.
- Top issue type.
- Recurrence.
- Latest incident.
- Nearby critical facilities.

---

# 28. News / Social Section

JANVAANI should automatically transform major civic incidents into readable public updates.

### Example

> **AI Civic Alert: Waterlogging Reported on ABC Road**
>
> JANVAANI detected significant water accumulation affecting a major road. Multiple citizens reported the incident within a short period. A nearby school increases the potential public impact.

Always show:

> **AI-generated summary**

The feed may contain:

- New Critical.
- Trending incident.
- Escalating incident.
- Resolved issue.
- Recurring hotspot alert.

---

# 29. Resolved Issues

Resolved issues should remain visible as public accountability evidence.

### Display

- Before image.
- After image.
- Resolution date.
- Municipal action.
- AI verification.
- Citizen feedback.

### AI Verification

Example:

```text
Before affected area: 34.7 m²
After affected area:   3.2 m²
Reduction: 90.8%

✅ Resolution Verified
```

Possible outcomes:

- ✅ Fully resolved.
- ⚠️ Partially resolved.
- ❌ Still detected / not verified.
- 🟡 Needs human review.

---

# 30. Escalation Engine

A complaint should not remain passive in a queue.

### Example workflow

```text
Citizen report
     ↓
AI analysis
     ↓
Municipal notification
     ↓
Assignment
     ↓
Work started
     ↓
SLA monitoring
     ↓
Escalation if overdue
     ↓
Supervisor / higher authority
```

Escalation can depend on:

- Criticality.
- Time unresolved.
- Civic impact.
- Complaint growth.
- Proximity to critical facilities.
.
---

# 31. SLA Tracking

Each municipality/department can define response and resolution targets.

Dashboard metrics:

- Average response time.
- Average resolution time.
- Resolved within SLA.
- Overdue incidents.
- Escalated incidents.
- Department-wise performance.

This turns JANVAANI into an operational accountability platform.

---

# 32. Municipal Command Center

The command center should prioritize action instead of raw data volume.

### Top summary

```text
🔴 Critical: 07
🟠 High: 18
🟡 Medium: 34
🟢 Low: 51
```

### Main panels

- Priority inbox.
- Live heatmap.
- Active incidents.
- Escalation queue.
- SLA performance.
- Hotspot alerts.
- Field-team status.
- Recurring locations.

---

# 33. Priority Inbox

Incidents should be automatically ordered by current civic priority.

Example:

```text
🔴 JV-1042  Waterlogging     94/100
🔴 JV-1091  Waste Dumping    91/100
🔴 JV-1104  Waterlogging     88/100
🟠 JV-1088  Waste            77/100
🟡 JV-1066  Waterlogging     52/100
```

The queue should update when new evidence changes the score.

---

# 34. Recommended Municipal Action

The platform may generate operational recommendations.

### Waterlogging example

1. Inspect nearby drainage.
2. Clear possible blockage.
3. Place warning barriers where required.
4. Monitor traffic.
5. Reinspect after action.

### Waste example

1. Dispatch sanitation team.
2. Remove accumulated waste.
3. Inspect nearby collection points.
4. Review segregation conditions.
5. Capture after-cleanup evidence.

These are decision-support recommendations, not autonomous government orders.

---

# 35. Field Worker Module

Workers should see:

- Assigned incident.
- Severity.
- Risk score.
- Location.
- AI segmentation.
- Nearby facility context.
- Recommended action.
- Navigation.
- Work status.
- Before photo.
- After photo.

Status flow:

```text
Assigned
  ↓
Accepted
  ↓
On the Way
  ↓
In Progress
  ↓
Completed
  ↓
AI Verification
```

---

# 36. Route Optimization

The system can collect multiple active incidents and build an optimized route.

Inputs:

- Priority.
- Location.
- Road network.
- Vehicle/team constraints.
- Work duration.
- Time windows.

Technology:

- OSRM for routing.
- OR-Tools for optimization.

Output:

```text
Municipal Depot
   ↓
Critical Incident A
   ↓
Critical Incident B
   ↓
High Incident C
   ↓
High Incident D
```

---

# 37. Voice Complaint Module

### Flow

```text
Citizen speaks
      ↓
Whisper
      ↓
Transcription
      ↓
Issue extraction
      ↓
AI analysis
      ↓
Complaint creation
```

Example:

> “There is a lot of water on the road near the hospital.”

The system can extract:

- Issue type: waterlogging.
- Mentioned landmark: hospital.
- Description.
- Suggested urgency.

---

# 38. Before/After Resolution Verification

JANVAANI should require evidence for closure for applicable incident types.

### Pipeline

```text
Original evidence
      ↓
Baseline segmentation / measurement
      ↓
Municipal cleanup
      ↓
After image
      ↓
Computer vision comparison
      ↓
Resolution confidence
```

### Example

```text
Before: 42 m²
After:   4 m²
Reduction: 90.5%
```

Result:

> ✅ AI Verified Resolution

---

# 39. Waste Intelligence

Initial target classes may include:

- Plastic waste.
- Organic waste.
- Mixed waste.
- Illegal dumping.
- Overflowing bin.

Potential future classes:

- Paper.
- Glass.
- Metal.
- Construction debris.
- Waste near drainage.
- Waste burning.

The exact class list should match the final annotated training dataset.

---

# 40. Waterlogging Intelligence

Initial target classes may include:

- Waterlogging.
- Flooded road.
- Standing water.
- Blocked drainage.

Potential future capabilities:

- Affected area estimation.
- Road obstruction detection.
- Persistent waterlogging tracking.
- Recurring waterlogging identification.

---

# 41. Responsive AI Decision Example

```text
Citizen Report
     ↓
YOLO26-Seg detects waterlogging
     ↓
14 related reports found
     ↓
H3/PostGIS identifies local cluster
     ↓
School 120m away
Hospital 480m away
Main road affected
     ↓
Complaint velocity rising quickly
     ↓
XGBoost Risk = 94/100
     ↓
🔴 CRITICAL
     ↓
Municipal Priority Inbox
     ↓
Recommended response
     ↓
Route team
     ↓
After-cleanup image
     ↓
Computer Vision verification
     ↓
✅ Resolved / ⚠️ Partial / ❌ Failed
```

---

# 42. Database Model — Core Entities

## Complaint

Suggested fields:

- complaint_id.
- incident_id.
- media_url.
- media_type.
- text_description.
- voice_transcript.
- latitude.
- longitude.
- created_at.
- evidence_score.
- status.

## Civic Incident

- incident_id.
- issue_type.
- severity.
- risk_score.
- civic_impact_score.
- evidence_score.
- h3_index.
- location.
- complaint_count.
- support_count.
- complaint_velocity.
- recurrence_count.
- assigned_authority.
- assigned_department.
- assigned_team.
- status.
- sla_deadline.
- escalation_level.
- created_at.
- updated_at.
- resolved_at.

## AI Analysis

- analysis_id.
- incident_id / complaint_id.
- model_name.
- model_version.
- detected_classes.
- confidence.
- segmentation_result.
- area_estimate.
- summary.
- created_at.

## Nearby Facility Evidence

- incident_id.
- facility_type.
- facility_name.
- distance_m.
- provider/source.
- relevance_weight.

## Status History

- status_id.
- incident_id.
- old_status.
- new_status.
- actor_type.
- timestamp.

## Feedback

- feedback_id.
- incident_id.
- rating.
- comment.
- created_at.

---

# 43. Suggested API Design

## Citizen APIs

```text
POST   /api/complaints
POST   /api/complaints/analyze
GET    /api/incidents
GET    /api/incidents/{id}
POST   /api/incidents/{id}/support
POST   /api/incidents/{id}/like
POST   /api/incidents/{id}/comments
GET    /api/incidents/{id}/comments
POST   /api/feedback
```

## AI APIs

```text
POST   /api/ai/detect
POST   /api/ai/segment
POST   /api/ai/transcribe
POST   /api/ai/summarize
POST   /api/ai/score
POST   /api/ai/verify-resolution
```

## GIS APIs

```text
GET    /api/map/heatmap
GET    /api/map/nearby-facilities
GET    /api/map/municipalities
GET    /api/map/hotspots
```

## Municipal APIs

```text
GET    /api/admin/incidents/priority
POST   /api/admin/incidents/{id}/assign
PATCH  /api/admin/incidents/{id}/status
POST   /api/admin/incidents/{id}/after-evidence
GET    /api/admin/sla
GET    /api/admin/performance
GET    /api/admin/predictions
```

---

# 44. Security & Access Control

## Citizen side

- No login/register required.
- Rate limiting.
- Abuse protection.
- File validation.
- Privacy-aware location display.
- Content moderation controls.

## Internal side

JWT authentication.

RBAC roles:

- Admin.
- Municipal authority.
- Supervisor.
- Field worker.

## Infrastructure

- HTTPS.
- Secure secrets management.
- Dockerized deployment.
- Input validation.
- Audit logs.
- Least-privilege access.

---

# 45. Privacy & Responsible AI

JANVAANI should:

- Minimize collection of personal data.
- Avoid publishing citizen-sensitive metadata.
- Generalize exact user locations in public views where required.
- Clearly label AI-generated text.
- Clearly distinguish AI recommendations from government decisions.
- Provide human-review paths for low-confidence cases.
- Keep internal authentication separate from citizen convenience.
- Log AI model versions for traceability.

---

# 46. Non-Functional Requirements

## Performance

- Fast initial page load.
- Responsive UI on low-to-mid-range mobile devices.
- Async AI processing for heavy video tasks.
- Queue-based background processing where needed.

## Reliability

- Failed AI inference should not lose the complaint.
- Retry mechanisms for external APIs.
- Fallback behavior when external map/place service is unavailable.

## Scalability

- Stateless FastAPI services where possible.
- Containerized services.
- Separate AI inference workloads from web requests.
- Database indexing for geospatial queries.

## Accessibility

- Keyboard navigation.
- Screen-reader support.
- High contrast mode.
- Reduced motion option.
- Simple-language explanations.
- Voice complaint capability.

---

# 47. AI / ML Development Requirements

## YOLO26-Seg Training Work

1. Define classes.
2. Collect representative images.
3. Annotate polygons/masks.
4. Split into train/validation/test.
5. Export in YOLO segmentation format.
6. Train YOLO26-Seg.
7. Evaluate on unseen images.
8. Review false positives/negatives.
9. Improve data/annotations.
10. Retrain and freeze a version for deployment.

## Model Versioning

Every deployed model should have:

- Model name.
- Model version.
- Dataset version.
- Training date.
- Metrics.
- Deployment status.

Example:

```text
janvaani-yolo26-seg-v1
janvaani-yolo26-seg-v2
```

---

# 48. SIH MVP Scope

For the first competition-ready version, prioritize:

### Must Have

- Public home page.
- Report complaint.
- Photo upload/camera.
- GPS location.
- YOLO26-Seg detection/segmentation.
- Complaint details.
- Public complaint feed.
- Support/like/comment.
- Heatmap.
- Responsive Civic AI score.
- Duplicate incident clustering.
- Nearby facility analysis.
- Priority inbox.
- Resolved section.
- Before/after verification demo.
- AI-generated summary.

### Strong Add-ons

- Voice complaints with Whisper.
- Municipal field-worker app.
- SLA/escalation.
- Route optimization.
- Predictive hotspots.
- Recurring problem detection.

### Future Expansion

- More waste classes.
- More civic issue types.
- Stronger causal/root-cause models.
- More municipalities.
- Advanced forecasting.
- Real municipal integrations.

---

# 49. Recommended Development Phases

## Phase 1 — AI Dataset & Model

- Finalize classes.
- Collect images.
- Annotate segmentation masks.
- Train YOLO26-Seg.
- Evaluate.

**Output:** `best.pt` segmentation model.

## Phase 2 — AI Backend

- FastAPI.
- Image upload endpoint.
- YOLO inference.
- Segmentation overlay.
- Structured result.

**Output:** working `/api/ai/analyze` flow.

## Phase 3 — Citizen Website

- Next.js.
- Responsive UI.
- Report complaint.
- Result preview.
- Complaint details.

**Output:** end-to-end citizen reporting.

## Phase 4 — Database & GIS

- PostgreSQL.
- PostGIS.
- H3.
- MapLibre.
- Heatmap.
- Nearby municipal body.

**Output:** geospatial civic platform.

## Phase 5 — Responsive Civic AI

- Incident clustering.
- Duplicate detection.
- Complaint velocity.
- Risk scoring.
- Civic impact.
- Nearby facility factors.
- Priority inbox.
- Explainable score.

**Output:** live priority engine.

## Phase 6 — Public Community Features

- Support.
- Likes.
- Comments.
- News/Social.
- AI summaries.
- Resolved issues.

**Output:** public civic network.

## Phase 7 — Municipal Operations

- Assignment.
- Status workflow.
- SLA.
- Escalation.
- Worker interface.
- Notifications.

**Output:** municipal workflow.

## Phase 8 — Routing & Verification

- OSRM.
- OR-Tools.
- Before/after CV.
- Resolution verification.

**Output:** operational closure loop.

## Phase 9 — Prediction

- Historical analysis.
- H3 hotspot features.
- XGBoost prediction.
- Recurring problem detection.

**Output:** predictive civic intelligence.

## Phase 10 — Deployment & Hardening

- Docker.
- HTTPS.
- JWT.
- RBAC.
- Rate limiting.
- Logging.
- Monitoring.
- Demo data preparation.

**Output:** SIH-ready deployable system.

---

# 50. Demo Story for SIH

A strong live demo should follow one incident from start to finish.

### Step 1

Citizen uploads a waterlogging photo.

### Step 2

YOLO26-Seg highlights the exact waterlogged region.

### Step 3

Citizen location is captured.

### Step 4

JANVAANI identifies nearby school, hospital, and main road.

### Step 5

Several other nearby users have already reported the same issue.

### Step 6

JANVAANI merges them into one civic incident.

### Step 7

Complaint velocity increases.

### Step 8

Responsive AI updates the score to **94/100 — Critical**.

### Step 9

The incident moves automatically to the top of the municipal priority inbox.

### Step 10

A recommended action and route are generated.

### Step 11

Field worker uploads after-cleanup evidence.

### Step 12

Computer vision verifies the reduction in affected area.

### Step 13

The issue moves to **Resolved**.

### Step 14

Citizens see the before/after result and submit feedback.

This demonstrates the complete JANVAANI lifecycle in a single story.

---

# 51. Key Differentiators

JANVAANI should be presented around these differentiators:

1. **Citizen-reporting without login friction.**
2. **AI detection + exact segmentation.**
3. **Many complaints → one civic incident.**
4. **Responsive risk that changes as the situation changes.**
5. **Location intelligence around schools, hospitals, roads, and other facilities.**
6. **Explainable red/orange/yellow/green priority.**
7. **Automatic escalation and SLA monitoring.**
8. **Recurring problem identification.**
9. **Predictive hotspot analysis.**
10. **Municipal route optimization.**
11. **Before/after AI verification.**
12. **Public transparency through complaints, news/social, heatmaps, and resolved history.**

---

# 52. Success Metrics

## Citizen

- Complaint submission completion rate.
- Average report time.
- Support/engagement rate.
- Feedback rate.

## AI

- Detection precision/recall/mAP.
- Segmentation quality.
- Evidence confidence calibration.
- Duplicate-clustering accuracy.
- Risk-score performance.

## Municipal

- Mean response time.
- Mean resolution time.
- SLA compliance.
- Critical incident response time.
- Verified resolution percentage.
- Repeated-incident rate.

## Platform

- Uptime.
- API latency.
- AI processing time.
- Error rate.
- External API failure rate.

---

# 53. Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Poor segmentation | Improve annotations, class balance, and retraining loop |
| Duplicate incident errors | Use multiple signals and human review for uncertain merges |
| False critical alerts | Explainable scoring, confidence thresholding, and audit logs |
| Incorrect nearby facility data | Use provider/source metadata and configurable verification |
| External map/API dependency | Abstract provider layer and maintain OpenStreetMap fallback where suitable |
| AI-generated misinformation | Ground summaries in stored evidence and label AI content |
| Public abuse/spam | Rate limiting, moderation, evidence checks |
| Privacy exposure | Minimize public precision and sensitive metadata |
| Slow video inference | Async jobs and background workers |
| Overly large scope | Keep SIH MVP focused on the highest-value lifecycle |

---

# 54. Final Product Definition

JANVAANI is an **AI-powered, geospatial civic intelligence and response platform** for waste and water-related public issues.

Its core innovation is not a single AI model. It is the coordinated use of:

> **YOLO26-Seg + Computer Vision + Whisper + optional multimodal AI + XGBoost + PostgreSQL/PostGIS + H3 + MapLibre/OpenStreetMap + OSRM + OR-Tools**

inside one continuous civic workflow.

### Final JANVAANI lifecycle

```text
REPORT
  ↓
DETECT
  ↓
SEGMENT
  ↓
UNDERSTAND
  ↓
MERGE RELATED REPORTS
  ↓
ANALYZE LOCATION & PUBLIC IMPACT
  ↓
SCORE RISK
  ↓
ESCALATE WHEN NECESSARY
  ↓
ASSIGN MUNICIPAL TEAM
  ↓
OPTIMIZE ROUTE
  ↓
CLEAN / RESOLVE
  ↓
VERIFY WITH COMPUTER VISION
  ↓
PUBLISH RESOLUTION
  ↓
LEARN FROM HISTORY
  ↓
PREDICT FUTURE HOTSPOTS
```

**JANVAANI — turning citizen voice into prioritized civic action.**
