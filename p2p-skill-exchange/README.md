# Peer-to-Peer Skill Exchange System 🎓
### College Java Mini Project (B.Tech 2nd Year)

A modern, cross-device **Peer-to-Peer Skill Exchange Web Application** developed in Java. Built using Java's native built-in `HttpServer` (`com.sun.net.httpserver`) and a responsive HTML5, CSS3, and Vanilla JavaScript frontend. The application is accessible from any web browser on your PC or on your **mobile phone / other devices connected to the same Wi-Fi**.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENTS (Any device with a browser)                   │
│      📱 Mobile Phones (Android/iOS)      💻 Laptops & Desktop PCs            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP Requests (fetch)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   BACKEND: Pure Java HTTP Web Server                        │
│            (Built-in com.sun.net.httpserver - No External Magic)            │
│  - StaticFileHandler (Serves HTML, CSS, JS to browsers)                     │
│  - ApiHandler (Routes /api/auth, /api/peers, /api/skills, /api/requests)    │
│  - JsonUtil (Transparent JSON serializer without complex frameworks)        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 APPLICATION LOGIC & DATA STRUCTURES & ALGORITHMS            │
│  - MatchingAlgorithm.java (Set Overlap, TimSort, Insertion Sort, Heap)      │
│  - Service Layer (AuthenticationService, SkillService, RequestService)      │
│  - Domain Models (Student, Skill, Match, PeerMatch, Feedback)               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 JDBC DATA ACCESS LAYER & RELATIONAL DATABASE                │
│  - Direct DAOs (StudentDAO, SkillDAO, RequestDAO, MatchDAO, FeedbackDAO)   │
│  - MySQL Database (Port 3306) with Auto Embedded H2 Fallback                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Architectural Layer Breakdown

### 1. Frontend: Responsive Web (HTML5, CSS3, Vanilla JavaScript)
- **Single Page Application (SPA):** 8 integrated views in `index.html` (Sign In / Register, Dashboard, Find Peers, My Skills, Peer Profile, Proposals/Requests, Active Matches, and Student Profile).
- **Responsive Styling (`css/style.css`):** Modern design system with dark/light visual contrast, touch-friendly buttons for smartphones, and desktop grid layout.
- **Client Networking (`js/app.js`):** Pure Vanilla JavaScript using native `fetch()` to communicate asynchronously with the Java backend. Zero heavy frameworks (no React, Angular, or Vue needed).

### 2. Web Server: Core Java `HttpServer`
- **Native HTTP Engine (`com.sun.net.httpserver`):** Zero external web server dependencies (no Tomcat, Jetty, or Spring Boot required). 100% explainable for 2nd-year B.Tech syllabus.
- **`WebServer.java`:** Entrypoint that binds to port `8080`, detects your laptop's local Wi-Fi IP address (`192.168.x.x`), and prints the mobile link.
- **`StaticFileHandler.java`:** Serves static HTML, CSS, JavaScript, and images using standard Java I/O streams.
- **`ApiHandler.java`:** RESTful request dispatcher for all JSON endpoints.
- **`JsonUtil.java`:** Simple, transparent JSON serializer and parser using standard Java `String` and `Map`.

### 3. Backend: Core Java & OOP
- **Encapsulation:** Domain models (`Student`, `Skill`, `PeerMatch`, `SkillExchangeRequest`, `Match`, `Feedback`) have private fields with validated getters and setters.
- **Abstraction & DAO Pattern:** Direct Data Access Objects (`StudentDAO`, `SkillDAO`, `RequestDAO`, `MatchDAO`, `FeedbackDAO`) encapsulating SQL statements and JDBC execution.

### 4. Backend: Data Structures & Algorithms (DSA)
- **Collections Framework:**
  - `ArrayList<T>`: Dynamic storage of students, skill lists, and active matches.
  - `HashSet<T>`: Used for $O(1)$ skill membership verification and calculating set intersection.
- **Set Intersection Algorithm (`MatchingAlgorithm`):**
  - Computes bidirectional compatibility:
    $$\text{Forward Overlap} = \frac{|\text{My Offered} \cap \text{Their Wanted}|}{\max(|\text{Their Wanted}|, 1)}$$
    $$\text{Backward Overlap} = \frac{|\text{My Wanted} \cap \text{Their Offered}|}{\max(|\text{Their Offered}|, 1)}$$
    $$\text{Match Percentage} = \text{round}\left(\frac{\text{Forward Overlap} + \text{Backward Overlap}}{2} \times 100\right)$$
- **Sorting Algorithms (`MatchingAlgorithm`):**
  - TimSort via `Collections.sort()` with custom `Comparator` for sorting peer matches by compatibility score.
  - Custom in-place **Insertion Sort** implementation demonstrating $O(N^2)$ algorithm mechanics.
- **Priority Queue Ranking (`MatchingAlgorithm`):**
  - Utilizes a Max-Heap `PriorityQueue` to extract top-K recommended peers in $O(M \log K)$ time.

### 5. Application Logic (Service Layer)
- `AuthenticationService`: Validates student credentials and logins with SHA-256 password hashing.
- `StudentService`: Profile management and student information updates.
- `SkillService`: Enforces business rules (e.g., a student cannot simultaneously offer and want the same skill).
- `PeerRecommendationService`: Finds compatible learning partners and ranks them.
- `RequestService`: Manages proposal lifecycles (Send, Accept, Reject, Pending).
- `MatchService`: Coordinates active study partnerships.
- `FeedbackService`: Handles 1–5 star ratings and reviews between exchange partners.

### 6. Database & JDBC Connectivity
- **JDBC Driver:** Uses MySQL Connector/J (`com.mysql.cj.jdbc.Driver`).
- **Parameterized Queries:** All SQL statements utilize `PreparedStatement` with `?` placeholders to guarantee 100% protection against **SQL Injection**.
- **Singleton Connection (`DatabaseConnection`):** Maintains a centralized JDBC connection with auto-reconnect capability.
- **Dual-Mode Persistence (Seamless Execution):**
  - **Primary:** Live MySQL server on `localhost:3306`.
  - **Auto Fallback:** Embedded local storage (`./data/p2p_skill_exchange.mv.db`) automatically activates if MySQL is offline, ensuring the project always runs on any computer without crashing!

---

## 👥 4-Member Project Division

| Team Member | Domain | Key Responsibilities | Key Classes / Files |
|:---|:---|:---|:---|
| **Member 1** | **Web Frontend & HTTP Server** | Web UI (HTML5/CSS/JS), HttpServer endpoints, static file serving, JSON serializer | `web/*`, `web/WebServer.java`, `StaticFileHandler.java`, `ApiHandler.java`, `JsonUtil.java` |
| **Member 2** | **Core Java (OOP & Services)** | Application logic, session handling, authentication, input validation | `service/*`, `model/*`, `util/PasswordHasher.java`, `util/InputValidator.java` |
| **Member 3** | **Data Structures & Algorithms** | Set intersection matching, peer ranking (heap), sorting algorithms | `algorithm/MatchingAlgorithm.java` |
| **Member 4** | **Database & JDBC** | Schema design, sample data, JDBC connection manager, PreparedStatement DAOs | `sql/schema.sql`, `sql/sample_data.sql`, `config/*`, `dao/*` |

---

## 🚀 How to Run the Application

### Prerequisites
1. **JDK 17 or higher** installed.
2. *(Optional)* **MySQL Server** installed (Port 3306). If MySQL is not running, the application automatically uses the embedded local database fallback.

### Option 1: Open with VS Code Live Server (Frontend Only)
1. Open the folder in VS Code.
2. In the explorer, right-click `web/index.html` (or `src/main/resources/web/index.html`).
3. Click **"Open with Live Server"**.
4. The application opens immediately at `http://127.0.0.1:5500/web/index.html` with all interactive features enabled.

### Option 2: Run Full Application with Java Backend
- **Inside VS Code:** Press **`F5`** (or select **Run > Start Debugging**).
- **Or via Terminal:** Run `mvn compile exec:java`.
- Open `http://localhost:8080` on your PC, or open the Wi-Fi IP (e.g. `http://192.168.x.x:8080`) on your smartphone.

---

---

## 🧪 Automated Testing
To run the automated smoke and integration test suite:
```cmd
mvn clean test-compile
java -cp "target/classes;target/test-classes;C:\Users\saket\.m2\repository\com\mysql\mysql-connector-j\8.3.0\mysql-connector-j-8.3.0.jar;C:\Users\saket\.m2\repository\com\h2database\h2\2.2.224\h2-2.2.224.jar" com.p2pskill.test.SmokeIntegrationTest
```
*(All 25 test cases verify database connectivity, password hashing, input validation, session management, and set intersection algorithms).*

