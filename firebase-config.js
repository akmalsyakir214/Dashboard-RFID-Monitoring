import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, ref, update, get, child, onValue, remove 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { 
    getAuth, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signOut as secondarySignOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
  apiKey: "AIzaSyDYY2-RZfe4RnRpE8ghToWnGfJQNcJF41g",
  authDomain: "rfid-access-and-security.firebaseapp.com",
  databaseURL: "https://rfid-access-and-security-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "rfid-access-and-security",
  storageBucket: "rfid-access-and-security.firebasestorage.app",
  messagingSenderId: "237024145430",
  appId: "1:237024145430:web:d843ba8c21ed9af2248537",
  measurementId: "G-N0D7V05P5S"
};

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// TETAPKAN TEMA
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}

// SEMAK PENGESAHAN ADMIN
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const dbRef = ref(db);
  let userRole = 'user';
  let userName = user.email || 'Admin';

  const snapshot = await get(child(dbRef, `users/${user.uid}`));
  if (snapshot.exists()) {
    const data = snapshot.val();
    if (data.role) userRole = data.role.toString().toLowerCase();
    if (data.name) userName = data.name;
  } else {
    const allUsersSnap = await get(child(dbRef, 'users'));
    if (allUsersSnap.exists()) {
      const allUsers = allUsersSnap.val();
      Object.keys(allUsers).forEach(key => {
        if (allUsers[key].email && allUsers[key].email.toLowerCase() === user.email.toLowerCase()) {
          if (allUsers[key].role) userRole = allUsers[key].role.toString().toLowerCase();
          if (allUsers[key].name) userName = allUsers[key].name;
        }
      });
    }
  }

  if (userRole !== 'admin') {
    alert("Akses ditolak! Halaman ini khusus untuk Pentadbir sahaja.");
    window.location.href = "user-dashboard.html";
    return;
  }

  const adminDisplay = document.getElementById("adminNameDisplay");
  if (adminDisplay) {
    adminDisplay.innerText = `${userName} 👤`;
  }
});

// LOGOUT
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", (e) => {
    e.preventDefault();
    signOut(auth)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Logout Error:", error);
        alert("Gagal untuk log keluar. Sila cuba lagi.");
      });
  });
}

// PAPARAN REALTIME DATABASE
const usersRef = ref(db, 'users');

onValue(usersRef, (snapshot) => {
  const table = document.getElementById("userTable");
  if (!table) return;
  
  table.innerHTML = "";
  const data = snapshot.val();

  if (data) {
    Object.keys(data).forEach((key) => {
      const user = data[key];
      const role = user.role || 'Student';
      const studentId = user.studentId || user.studentID || 'N/A';
      const uName = user.name || 'N/A';
      const email = user.email || 'N/A';
      const displayUid = user.uid || key;

      table.innerHTML += `
        <tr>
          <td><code>${displayUid}</code></td>
          <td>${uName}</td>
          <td>${email}</td>
          <td>${studentId}</td>
          <td><span class="badge bg-secondary">${role}</span></td>
          <td class="text-success fw-bold">Active</td>
          <td>
            <button class="btn btn-warning btn-sm me-1" onclick="editUser('${displayUid}', '${uName}', '${email}', '${studentId}', '${role}')">
              <i class="fa fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteUser('${key}')">
              <i class="fa fa-trash"></i>
            </button>
          </td>
        </tr>`;
    });
  } else {
    table.innerHTML = `<tr><td colspan="7" class="text-muted">No users found</td></tr>`;
  }
});

// INITIALIZE MODAL BOOTSTRAP
const modalEl = document.getElementById('userModal');
let bsModal;
if (modalEl) {
  bsModal = new bootstrap.Modal(modalEl);
}

// SIMPAN PENGGUNA DENGAN RFID CARD UID + FIREBASE AUTHENTICATION
const saveBtn = document.getElementById("saveUserBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const rfidUid = document.getElementById("uid").value.trim();
    const name = document.getElementById("name").value.trim();
    const studentId = document.getElementById("studentid").value.trim();
    const role = document.getElementById("role").value;

    const isEdit = document.getElementById("uid").readOnly && rfidUid !== "";

    if (!name || !email || !rfidUid) {
      return alert("Sila isi E-mel, RFID UID, dan Nama!");
    }

    try {
      let authUid = "";

      if (!isEdit) {
        if (!password || password.length < 6) {
          return alert("Sila masukkan kata laluan sekurang-kurangnya 6 aksara untuk akaun baharu!");
        }

        // Cipta instance kedua supaya sesi Admin semasa tidak terkeluar (sign-out)
        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        authUid = userCredential.user.uid;

        await secondarySignOut(secondaryAuth);
      }

      // Simpan ke Realtime Database Menggunakan RFID UID
      await update(ref(db, `users/${rfidUid}`), {
        uid: rfidUid,
        authUid: authUid,
        email: email,
        name: name,
        studentId: studentId,
        role: role.toLowerCase(),
        updatedAt: Date.now()
      });

      alert(isEdit ? "Pengguna berjaya dikemaskini!" : "Kad RFID & Pengguna berjaya didaftarkan!");
      if (bsModal) bsModal.hide();
      resetForm();

    } catch (err) {
      console.error("Ralat pendaftaran:", err);
      alert("Gagal menyimpan pengguna: " + err.message);
    }
  });
}

// FUNGSI GLOBAL UNTUK BINDING EVENT HTML (EDIT, DELETE, RESET)
window.editUser = function(uid, name, email, studentId, role) {
  document.getElementById("userModalTitle").innerText = "Edit User";
  document.getElementById("uid").value = uid;
  document.getElementById("uid").readOnly = true;
  document.getElementById("email").value = email === 'N/A' ? '' : email;
  document.getElementById("email").readOnly = true;
  document.getElementById("password").placeholder = "(Biarkan kosong jika tidak ubah)";
  document.getElementById("name").value = name;
  document.getElementById("studentid").value = studentId === 'N/A' ? '' : studentId;
  document.getElementById("role").value = role.charAt(0).toUpperCase() + role.slice(1);
  if (bsModal) bsModal.show();
};

window.deleteUser = function(key) {
  if (confirm("Padam pengguna ini dari Realtime Database?")) {
    remove(ref(db, `users/${key}`)).catch(err => {
      console.error("Error deleting user:", err);
      alert("Gagal memadam pengguna.");
    });
  }
};

window.resetForm = function() {
  document.getElementById("userModalTitle").innerText = "Add New User";
  document.getElementById("uid").readOnly = false;
  document.getElementById("email").readOnly = false;
  document.getElementById("uid").value = "";
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  document.getElementById("password").placeholder = "Password (Min 6 characters)";
  document.getElementById("name").value = "";
  document.getElementById("studentid").value = "";
  document.getElementById("role").value = "Student";
};