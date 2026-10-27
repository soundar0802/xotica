/* =========================================================
   OUR STORES – store finder (list + Leaflet map)
   ========================================================= */

/* Placeholder stores – replace the name, address, hours, phone, map position
   (lat / lng), directions link and order link for each store */
const STORES = [
  { id: "store-01", name: "Store Name 01", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.7632, lng: -2.7031, directions: "#", order: "#" },
  { id: "store-02", name: "Store Name 02", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.4808, lng: -2.2426, directions: "#", order: "#" },
  { id: "store-03", name: "Store Name 03", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.7486, lng: -2.4875, directions: "#", order: "#" },
  { id: "store-04", name: "Store Name 04", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.5769, lng: -2.4282, directions: "#", order: "#" },
  { id: "store-05", name: "Store Name 05", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.7893, lng: -2.2405, directions: "#", order: "#" },
  { id: "store-06", name: "Store Name 06", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.8175, lng: -3.0357, directions: "#", order: "#" },
  { id: "store-07", name: "Store Name 07", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.6458, lng: -3.0050, directions: "#", order: "#" },
  { id: "store-08", name: "Store Name 08", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.5450, lng: -2.6325, directions: "#", order: "#" },
  { id: "store-09", name: "Store Name 09", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.6097, lng: -2.1561, directions: "#", order: "#" },
  { id: "store-10", name: "Store Name 10", street: "Street address", town: "Town", postcode: "Postcode", hours: "Mon – Sun : 11:00AM – Midnight", phone: "01234 567890", lat: 53.4084, lng: -2.9916, directions: "#", order: "#" }
];

(function () {
  const mapEl = document.getElementById("storeMap");
  if (!mapEl || typeof L === "undefined") return;

  const listEl = document.getElementById("storeList");
  const countEl = document.getElementById("storeCount");
  const queryEl = document.getElementById("storeQuery");
  const nearBtn = document.getElementById("storeNear");
  const detail = document.getElementById("storeDetail");
  const note = document.getElementById("storeNote");

  let visible = STORES.slice();
  let selected = null;
  let origin = null;
  const markers = {};

  // Brand pin – red drop with the Xotica logo in a white circle
  const pinIcon = L.divIcon({
    className: "",
    html: '<div class="finder-pin"><span class="finder-pin-logo"><img src="assets/images/logo/map-pin-logo.png" alt=""></span></div>',
    iconSize: [54, 60],
    iconAnchor: [27, 59]
  });

  const map = L.map(mapEl, { scrollWheelZoom: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: "abc",
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
  map.fitBounds(L.latLngBounds(STORES.map(s => [s.lat, s.lng])), { padding: [50, 50] });
  map.on("click", closeDetail);

  STORES.forEach(store => {
    const m = L.marker([store.lat, store.lng], { title: store.name, icon: pinIcon }).addTo(map);
    m.on("click", () => select(store.id, true));
    markers[store.id] = m;
  });

  const address = s => s.street + ", " + s.town + ", " + s.postcode;
  const distance = s => (origin && s.dist != null) ? s.dist.toFixed(1) + " mi" : "";

  function render() {
    listEl.innerHTML = "";
    countEl.textContent = visible.length === STORES.length
      ? "Showing all stores"
      : visible.length + " matching " + (visible.length === 1 ? "store" : "stores");

    if (!visible.length) {
      listEl.innerHTML = '<div class="finder-empty"><b>No stores found</b><p>Nothing matched that search. Try a nearby town, or show every store.</p>' +
        '<button class="btn-page btn-page-primary" type="button" id="storeClear">Show all stores</button></div>';
      document.getElementById("storeClear").onclick = () => { queryEl.value = ""; filter(); queryEl.focus(); };
      return;
    }

    visible.forEach(store => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "finder-card" + (selected === store.id ? " is-on" : "");
      card.dataset.id = store.id;
      card.innerHTML =
        '<span class="finder-card-head"><span class="finder-card-name">' + store.name + '</span>' +
        '<span class="finder-card-dist">' + distance(store) + '</span></span>' +
        '<span class="finder-card-addr">' + address(store) + '</span>' +
        '<span class="finder-card-phone">' + store.phone + '</span>';
      card.addEventListener("click", () => select(store.id, false));
      listEl.appendChild(card);
    });
  }

  function setPin(id) {
    Object.keys(markers).forEach(key => {
      const el = markers[key].getElement();
      const pin = el && el.querySelector(".finder-pin");
      if (pin) pin.classList.toggle("is-on", key === id);
    });
  }

  function select(id, fromPin) {
    const store = STORES.find(s => s.id === id);
    if (!store) return;
    selected = id;
    setPin(id);
    map.flyTo([store.lat, store.lng], Math.max(map.getZoom(), 12), { duration: .6 });

    document.getElementById("dName").textContent = store.name;
    document.getElementById("dAddr").textContent = address(store);
    document.getElementById("dHours").textContent = store.hours;
    const phone = document.getElementById("dPhone");
    phone.textContent = store.phone;
    phone.href = "tel:" + store.phone.replace(/[^0-9+]/g, "");
    document.getElementById("dDir").href = store.directions;
    document.getElementById("dOrder").href = store.order;
    detail.classList.add("is-open");
    note.style.display = "none";

    render();
    const card = listEl.querySelector('[data-id="' + id + '"]');
    if (card && fromPin) card.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function closeDetail() {
    if (!detail.classList.contains("is-open")) return;
    detail.classList.remove("is-open");
    note.style.display = "";
    selected = null;
    setPin(null);
    render();
  }
  document.getElementById("storeDetailClose").addEventListener("click", closeDetail);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeDetail(); });

  function filter() {
    const q = queryEl.value.trim().toLowerCase();
    visible = !q ? STORES.slice() : STORES.filter(s =>
      (s.name + " " + address(s)).toLowerCase().includes(q));
    if (origin) visible.sort((a, b) => a.dist - b.dist);

    Object.keys(markers).forEach(key => {
      const show = visible.some(s => s.id === key);
      if (show && !map.hasLayer(markers[key])) markers[key].addTo(map);
      if (!show && map.hasLayer(markers[key])) map.removeLayer(markers[key]);
    });

    if (visible.length) {
      map.flyToBounds(L.latLngBounds(visible.map(s => [s.lat, s.lng])), { padding: [60, 60], maxZoom: 12, duration: .6 });
      if (visible.length === 1) select(visible[0].id, true);
      else if (selected && !visible.some(s => s.id === selected)) closeDetail();
    }
    render();
  }
  queryEl.addEventListener("input", filter);
  document.getElementById("storeSearch").addEventListener("submit", e => { e.preventDefault(); filter(); });

  // Distance in miles between two points
  function miles(lat1, lng1, lat2, lng2) {
    const rad = x => x * Math.PI / 180;
    const dLat = rad(lat2 - lat1);
    const dLng = rad(lng2 - lng1);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * 3958.8 * Math.asin(Math.sqrt(h));
  }

  nearBtn.addEventListener("click", () => {
    if (!navigator.geolocation) { nearBtn.textContent = "Location unavailable"; return; }
    nearBtn.textContent = "Locating…";
    navigator.geolocation.getCurrentPosition(pos => {
      origin = pos.coords;
      STORES.forEach(s => { s.dist = miles(origin.latitude, origin.longitude, s.lat, s.lng); });
      nearBtn.textContent = "Nearest first";
      nearBtn.disabled = true;
      filter();
      if (visible.length) select(visible[0].id, true);
    }, () => { nearBtn.textContent = "Turn on location to sort"; }, { timeout: 8000 });
  });

  render();
  window.addEventListener("resize", () => map.invalidateSize());
  // The section fades in, so recalculate the map size once it's visible
  setTimeout(() => map.invalidateSize(), 600);
})();
