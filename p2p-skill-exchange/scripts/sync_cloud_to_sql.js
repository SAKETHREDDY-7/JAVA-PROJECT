const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'peer-to-peer-interaction-7';

async function fetchCollection(name) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${name}`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.documents || []);
        } catch (e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function sync() {
  console.log('[CLOUD-SYNC] Fetching live data from Firebase Firestore (' + PROJECT_ID + ')...');
  const students = await fetchCollection('students');
  const requests = await fetchCollection('requests');
  const matches = await fetchCollection('matches');

  console.log(`[CLOUD-SYNC] Downloaded: ${students.length} students, ${requests.length} requests, ${matches.length} matches.`);

  // Write a clean SQL migration file
  let sql = `-- Auto-synced from Firebase Firestore\n`;
  sql += `DELETE FROM feedback;\nDELETE FROM \`match\`;\nDELETE FROM skill_exchange_request;\nDELETE FROM student_offered_skill;\nDELETE FROM student_wanted_skill;\nDELETE FROM student;\n\n`;

  // Insert students
  students.forEach((doc, idx) => {
    const f = doc.fields || {};
    const id = f.studentId?.integerValue || f.id?.integerValue || (idx + 11);
    const num = f.studentNumber?.stringValue || `STU${id}`;
    const name = (f.fullName?.stringValue || f.name?.stringValue || 'Student').replace(/'/g, "''");
    const email = (f.email?.stringValue || '').replace(/'/g, "''");
    const pass = f.password?.stringValue || 'Password123';
    const dept = (f.department?.stringValue || f.dept?.stringValue || 'Engineering').replace(/'/g, "''");
    const year = f.yearOfStudy?.integerValue || f.year?.integerValue || 2;
    const bio = (f.bio?.stringValue || '').replace(/'/g, "''");

    // SHA-256 password hash
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(pass, 'utf8').digest('hex');

    sql += `INSERT INTO student (student_id, student_number, full_name, email, password_hash, department, year_of_study, bio) VALUES (${id}, '${num}', '${name}', '${email}', '${hash}', '${dept}', ${year}, '${bio}');\n`;

    // Offered skills
    const offered = f.offered?.arrayValue?.values || [];
    offered.forEach(v => {
      const sName = (v.stringValue || '').replace(/'/g, "''");
      sql += `INSERT INTO student_offered_skill (student_id, skill_id) SELECT ${id}, skill_id FROM skill WHERE skill_name = '${sName}';\n`;
    });

    // Wanted skills
    const wanted = f.wanted?.arrayValue?.values || [];
    wanted.forEach(v => {
      const sName = (v.stringValue || '').replace(/'/g, "''");
      sql += `INSERT INTO student_wanted_skill (student_id, skill_id) SELECT ${id}, skill_id FROM skill WHERE skill_name = '${sName}';\n`;
    });
  });

  // Insert requests
  requests.forEach((doc, idx) => {
    const f = doc.fields || {};
    const reqId = idx + 1;
    const sender = f.fromId?.integerValue || f.senderId?.integerValue || 11;
    const receiver = f.toId?.integerValue || f.receiverId?.integerValue || 12;
    const msg = (f.message?.stringValue || f.msg?.stringValue || '').replace(/'/g, "''");
    const status = f.status?.stringValue || 'PENDING';
    sql += `INSERT INTO skill_exchange_request (request_id, sender_id, receiver_id, message, status) VALUES (${reqId}, ${sender}, ${receiver}, '${msg}', '${status}');\n`;
  });

  // Insert matches
  matches.forEach((doc, idx) => {
    const f = doc.fields || {};
    const matchId = idx + 1;
    const reqId = idx + 1;
    const s1 = f.studentId1?.integerValue || 11;
    const s2 = f.studentId2?.integerValue || 12;
    const score = f.matchScore?.integerValue || 85;
    sql += `INSERT INTO \`match\` (match_id, request_id, student_id_1, student_id_2, match_score, is_active) VALUES (${matchId}, ${reqId}, ${s1}, ${s2}, ${score}, 1);\n`;
  });

  const sqlPath = path.join('d:\\JAVA PROJECT\\p2p-skill-exchange\\sql\\firestore_sync.sql');
  fs.writeFileSync(sqlPath, sql, 'utf8');
  console.log('[CLOUD-SYNC] Generated sync SQL script: ' + sqlPath);
}

sync();
