// ================== PI INIT ==================
Pi.init({ version: "2.0" });

let user = null;
let cart = [];

// ================== FIREBASE CONFIG ==================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};

// INIT FIREBASE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// ================== LOGIN ==================
async function login() {
  try {
    const scopes = ['username', 'payments'];
    const auth = await Pi.authenticate(scopes, onIncompletePaymentFound);

    user = auth.user;
    document.getElementById("user").innerText =
      "Welcome " + user.username;

    loadAds();

  } catch (e) {
    console.error(e);
  }
}

// ================== POST AD ==================
async function postAd() {
  const file = document.getElementById("imageInput").files[0];
  const title = document.getElementById("titleInput").value;
  const price = document.getElementById("priceInput").value;

  if (!file  !title  !price) {
    alert("Fill all fields");
    return;
  }

  // UPLOAD IMAGE
  const storageRef = storage.ref("ads/" + Date.now());
  await storageRef.put(file);
  const imageUrl = await storageRef.getDownloadURL();

  // SAVE TO FIRESTORE
  await db.collection("ads").add({
    title: title,
    price: parseFloat(price),
    image: imageUrl,
    owner: user.username,
    createdAt: Date.now()
  });

  alert("Advert posted!");
  loadAds();
}

// ================== LOAD ADS ==================
async function loadAds() {
  const container = document.getElementById("products");
  container.innerHTML = "Loading...";

  const snapshot = await db.collection("ads")
    .orderBy("createdAt", "desc")
    .get();

  container.innerHTML = "";

  snapshot.forEach(doc => {
    const ad = doc.data();

    container.innerHTML += 
      <div class="card">
        <img src="${ad.image}" style="width:100%">
        <h3>${ad.title}</h3>
        <p>${ad.price} Pi</p>
        <small>Seller: ${ad.owner}</small><br>
        <button onclick="addToCart('${doc.id}', ${ad.price}, '${ad.title}')">
          Add to Cart
        </button>
      </div>
    ;
  });
}

// ================== CART ==================
function addToCart(id, price, title) {
  cart.push({ id, price, title });
  renderCart();
}

function renderCart() {
  const container = document.getElementById("cartItems");
  container.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    container.innerHTML += <p>${item.title} - ${item.price} Pi</p>;
    total += item.price;
  });

  document.getElementById("total").innerText =
    "Total: " + total + " Pi";
}

// ================== CHECKOUT ==================
function checkout() {
  if (cart.length === 0) {
    alert("Cart empty");
    return;
  }

  const total = cart.reduce((sum, i) => sum + i.price, 0);

  Pi.createPayment({
    amount: total,
    memo: "ZAK Order",
    metadata: cart
  }, {
    onReadyForServerApproval: (paymentId) => {
      console.log(paymentId);
    },

    onReadyForServerCompletion: (paymentId, txid) => {
      alert("Payment successful!");
      cart = [];
      renderCart();
    },

    onCancel: () => alert("Cancelled"),
    onError: (err) => console.error(err)
  });
}

function onIncompletePaymentFound(payment) {
  console.log(payment);
                   }
