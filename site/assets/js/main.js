/* Priscimos Enterprise Solutions: site behaviour (no dependencies) */
(function () {
  "use strict";
  var d = document;
  d.documentElement.classList.add("js");

  /* ---------- Sticky header shadow ---------- */
  var header = d.querySelector("[data-header]");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = d.querySelector(".nav-toggle");
  var nav = d.getElementById("primary-nav");
  var subToggles = d.querySelectorAll(".sub-toggle");

  function closeSubs(except) {
    subToggles.forEach(function (b) { if (b !== except) b.setAttribute("aria-expanded", "false"); });
  }
  function setMenu(open) {
    if (!toggle) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    d.body.classList.toggle("nav-open", open);
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { setMenu(false); closeSubs(); }
    });
    window.matchMedia("(min-width: 1100px)").addEventListener("change", function (mq) {
      if (mq.matches) setMenu(false);
    });
  }
  subToggles.forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = b.getAttribute("aria-expanded") !== "true";
      closeSubs(b);
      b.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  d.addEventListener("click", function (e) { if (!e.target.closest(".has-sub")) closeSubs(); });
  d.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openSub = d.querySelector('.sub-toggle[aria-expanded="true"]');
    closeSubs();
    if (openSub) { openSub.focus(); return; }
    if (d.body.classList.contains("nav-open")) { setMenu(false); toggle.focus(); }
  });

  /* ---------- Highlight the section in view (home page) ---------- */
  var navLinks = Array.prototype.slice.call(d.querySelectorAll('.nav-menu a[href^="#"]'));
  if (navLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    navLinks.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = d.getElementById(id);
      if (sec) byId[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var link = byId[en.target.id];
        if (!link) return;
        if (en.isIntersecting) {
          navLinks.forEach(function (a) { a.classList.remove("is-current"); });
          link.classList.add("is-current");
        } else if (link.classList.contains("is-current") && en.boundingClientRect.top > 0) {
          link.classList.remove("is-current");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(byId).forEach(function (id) { io.observe(d.getElementById(id)); });
  }

  /* ---------- Coverage map <-> county list ---------- */
  var map = d.querySelector(".covmap");
  if (map) {
    var setCounty = function (slug, on) {
      d.querySelectorAll('[data-county="' + slug + '"]').forEach(function (el) {
        el.classList.toggle("is-active", on);
      });
    };
    d.querySelectorAll(".county-list li, .covmap .county").forEach(function (el) {
      var slug = el.getAttribute("data-county");
      el.addEventListener("mouseenter", function () { setCounty(slug, true); });
      el.addEventListener("mouseleave", function () { setCounty(slug, false); });
    });
  }

  /* ---------- Quote form ---------- */
  var SERVICE_PARAM = { "medical": "Medical courier", "non-medical": "Non-medical courier", "custom": "Other / custom" };
  var MESSAGES = {
    first_name: "Enter your first name.",
    last_name: "Enter your last name.",
    phone: "Enter a phone number we can reach you on.",
    email: "Enter an email address, like name@example.com.",
    service: "Choose the service you need.",
    pickup: "Enter the pickup city or ZIP code.",
    dropoff: "Enter the drop-off city or ZIP code."
  };

  d.querySelectorAll("[data-quote-form]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var label = button.querySelector(".btn-label");
    var phoneLink = d.querySelector('a[href^="tel:"]');
    var mailLink = d.querySelector('a[href^="mailto:"]');

    // Preselect the service from ?service=medical|non-medical|custom
    var wanted = new URLSearchParams(window.location.search).get("service");
    if (wanted && SERVICE_PARAM[wanted] && form.elements.service) form.elements.service.value = SERVICE_PARAM[wanted];

    function fieldError(input, msg) {
      var id = input.id + "-error";
      var err = d.getElementById(id);
      if (msg) {
        if (!err) {
          err = d.createElement("span");
          err.className = "field-error";
          err.id = id;
          (input.closest(".select-wrap") || input).insertAdjacentElement("afterend", err);
        }
        err.textContent = msg;
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", id);
      } else {
        if (err) err.remove();
        input.removeAttribute("aria-invalid");
        input.removeAttribute("aria-describedby");
      }
    }

    function check(input) {
      var v = (input.value || "").trim();
      var name = input.name;
      if (!input.required) return true;
      var ok = v.length > 0;
      if (ok && name === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (ok && name === "phone") ok = v.replace(/\D/g, "").length >= 7;
      fieldError(input, ok ? "" : MESSAGES[name] || "Fill in this field.");
      return ok;
    }

    form.querySelectorAll("[required]").forEach(function (input) {
      input.addEventListener("blur", function () { if (input.value.trim()) check(input); });
      input.addEventListener("input", function () { if (input.getAttribute("aria-invalid") === "true") check(input); });
      input.addEventListener("change", function () { if (input.getAttribute("aria-invalid") === "true") check(input); });
    });

    function showError(text) {
      status.className = "form-status is-error";
      var phone = phoneLink ? phoneLink.textContent.replace(/^\s*Call\s*/i, "").trim() : "";
      status.innerHTML = "";
      status.appendChild(d.createTextNode(text + " "));
      if (phoneLink) {
        var a = d.createElement("a");
        a.href = phoneLink.getAttribute("href");
        a.textContent = "Call " + (phone || "us");
        status.appendChild(a);
        status.appendChild(d.createTextNode(mailLink ? " or " : "."));
      }
      if (mailLink) {
        var m = d.createElement("a");
        m.href = mailLink.getAttribute("href");
        m.textContent = "email us";
        status.appendChild(m);
        status.appendChild(d.createTextNode("."));
      }
    }

    function showSuccess(firstName) {
      var heading = form.getAttribute("aria-labelledby");
      var box = d.createElement("div");
      box.className = "quote-form form-success";
      box.setAttribute("tabindex", "-1");
      box.innerHTML =
        '<span class="ok-mark"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></span>' +
        "<h3>Quote request sent</h3>" +
        "<p></p>";
      var p = box.querySelector("p");
      p.textContent = "Thanks" + (firstName ? ", " + firstName : "") + ". We'll reply by phone or email soon. If your delivery can't wait, ";
      if (phoneLink) {
        var call = d.createElement("a");
        call.href = phoneLink.getAttribute("href");
        call.textContent = "call " + phoneLink.getAttribute("href").replace(/^tel:\+1(\d{3})(\d{3})(\d{4})$/, "($1) $2-$3");
        p.appendChild(call);
        p.appendChild(d.createTextNode("."));
      } else {
        p.appendChild(d.createTextNode("call us."));
      }
      if (heading) box.setAttribute("aria-labelledby", heading);
      form.replaceWith(box);
      box.focus();
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      status.className = "form-status";

      var firstBad = null;
      form.querySelectorAll("[required]").forEach(function (input) {
        if (!check(input) && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }

      // Spam trap: real people never fill this hidden field.
      if (form.elements.website && form.elements.website.value) { showSuccess(""); return; }

      button.disabled = true;
      label.textContent = "Sending…";
      // Without JavaScript the form posts normally and FormSubmit redirects to thank-you.html (_next).
      // With JavaScript we use FormSubmit's AJAX endpoint so the visitor stays on the page.
      fetch(form.action.replace("://formsubmit.co/", "://formsubmit.co/ajax/"), {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      })
        .then(function (res) {
          return res.json().catch(function () { return { ok: false }; }).then(function (data) {
            return { status: res.status, data: data || {} };
          });
        })
        .then(function (r) {
          if (r.status >= 200 && r.status < 300 && r.data.ok !== false) {
            var first = (form.elements.first_name.value || "").trim();
            showSuccess(first);
            return;
          }
          if (r.data.errors) {
            Object.keys(r.data.errors).forEach(function (k) {
              if (form.elements[k]) fieldError(form.elements[k], r.data.errors[k]);
            });
          }
          showError(r.data.message || "Your request didn't send.");
        })
        .catch(function () {
          showError("Your request didn't send because the connection failed.");
        })
        .then(function () {
          button.disabled = false;
          label.textContent = "Send quote request";
        });
    });
  });

  /* ---------- Footer year ---------- */
  d.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
})();
