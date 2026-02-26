# 🚀 GraphQL Profile Dashboard

A modern, neon-styled personal profile dashboard built using **GraphQL**, **JWT authentication**, and **pure SVG charts**.

This project was developed as part of the Zone01 curriculum to demonstrate:

- GraphQL queries (normal, nested, and with arguments)
- Authentication using JWT
- Data visualization with SVG
- Frontend architecture without frameworks
- Hosting with GitHub Pages

---

## 🌍 Live Demo

🔗 **Live Website:**  
https://aandrik23.github.io/graphql/

🔗 **GitHub Repository:**  
https://github.com/aandrik23/graphql

---

## 📌 Project Overview

This application connects to the Zone01 GraphQL endpoint and dynamically generates a personal dashboard containing:

- User identity information
- Total XP
- Audit ratio
- Pass / Fail statistics
- XP growth over time
- Top projects by XP
- Visual statistics using SVG

All charts are built manually using SVG — no external charting libraries were used.

---

## 🔐 Authentication Flow

The login system works with:

- `username:password`
- `email:password`

### How it works:

1. User submits credentials
2. Credentials are sent using **Basic Authentication**
3. The server returns a **JWT token**
4. The token is stored in `localStorage`
5. All GraphQL requests use `Authorization: Bearer <token>`

Logout removes the JWT from storage.

---

## 📊 Charts Implemented (SVG Only)

### 1️⃣ XP Over Time
- Cumulative XP growth
- X and Y axis labels
- Area + line chart
- Dynamic scaling

### 2️⃣ Top Projects XP
- Horizontal bar chart
- Scrollable container
- Gradient neon bars
- Dynamic width scaling

### 3️⃣ Pass / Fail Ratio
- Donut chart
- Gradient slices
- Percentage inside center
- Based on `progress` table (grade 1 = pass, 0 = fail)

### 4️⃣ Audit Done vs Received
- Dual comparison bars
- Ratio calculation
- Neon gradient styling
- Proper spacing (no overlap)

---

## 🛠 Technologies Used

- HTML5
- CSS3 (Glassmorphism + Neon theme)
- Vanilla JavaScript (ES Modules)
- GraphQL
- JWT Authentication
- SVG for data visualization
- GitHub Pages (hosting)

No frameworks or libraries were used.

---

## 📂 Project Structure

```
graphql/
│
├── index.html
├── styles.css
├── app.js
├── auth.js
├── api.js
├── queries.js
├── charts.js
└── README.md
```

---

## ⚙️ How to Run Locally

Clone the repository:

```bash
git clone https://github.com/aandriko23/graphql.git
cd graphql
```

Run with a local server (example using `serve`):

```bash
npx serve .
```

Or use Live Server in VSCode.

Then open:

```
http://localhost:3000
```

---

## 🌐 Hosting

The project is deployed using **GitHub Pages**:

- Branch: `main`
- Folder: `/ (root)`
- HTTPS enforced

---

## 🎯 GraphQL Usage

The project uses:

- Normal queries
- Nested queries
- Queries with variables
- Filtering using `where` conditions

Example:

```graphql
query GetUser($uid: Int!) {
  transaction(where: { userId: { _eq: $uid } }) {
    type
    amount
  }
}
```

---

## 🧠 What I Learned

- How JWT authentication works
- How to structure frontend architecture without frameworks
- How to manually build charts using SVG math
- How to scale UI dynamically from real backend data
- Hosting and domain deployment using GitHub Pages

---

## 📎 Notes

- The project communicates directly with the Zone01 GraphQL endpoint.
- All data is fetched dynamically after authentication.
- The UI is fully responsive.

---

## 👨‍💻 Author

Andreas Rafail Andrikopoulos  
Zone01 Student  
GitHub: https://github.com/aandriko23

---

# ✅ Ready for Submission

This project fulfills all requirements:

- GraphQL queries (normal, nested, arguments)
- JWT authentication
- Profile page with personal data
- Multiple SVG statistic charts
- Hosted online with real domain