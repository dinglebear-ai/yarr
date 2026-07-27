/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function Ds(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const s of e.split(",")) t[s] = 1;
  return (s) => s in t;
}
const J = {}, ut = [], Ie = () => {
}, Kn = () => !1, ss = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), ns = (e) => e.startsWith("onUpdate:"), Q = Object.assign, js = (e, t) => {
  const s = e.indexOf(t);
  s > -1 && e.splice(s, 1);
}, li = Object.prototype.hasOwnProperty, H = (e, t) => li.call(e, t), M = Array.isArray, at = (e) => $t(e) === "[object Map]", Yn = (e) => $t(e) === "[object Set]", fn = (e) => $t(e) === "[object Date]", I = (e) => typeof e == "function", G = (e) => typeof e == "string", Ne = (e) => typeof e == "symbol", K = (e) => e !== null && typeof e == "object", qn = (e) => (K(e) || I(e)) && I(e.then) && I(e.catch), kn = Object.prototype.toString, $t = (e) => kn.call(e), ci = (e) => $t(e).slice(8, -1), rs = (e) => $t(e) === "[object Object]", Hs = (e) => G(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Ct = /* @__PURE__ */ Ds(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), is = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((s) => t[s] || (t[s] = e(s)));
}, fi = /-\w/g, ce = is(
  (e) => e.replace(fi, (t) => t.slice(1).toUpperCase())
), ui = /\B([A-Z])/g, pe = is(
  (e) => e.replace(ui, "-$1").toLowerCase()
), Jn = is((e) => e.charAt(0).toUpperCase() + e.slice(1)), hs = is(
  (e) => e ? `on${Jn(e)}` : ""
), Pe = (e, t) => !Object.is(e, t), ds = (e, ...t) => {
  for (let s = 0; s < e.length; s++)
    e[s](...t);
}, Gn = (e, t, s, n = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: n,
    value: s
  });
}, ai = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, un = (e) => {
  const t = G(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let an;
const os = () => an || (an = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : {});
function $s(e) {
  if (M(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++) {
      const n = e[s], r = G(n) ? gi(n) : $s(n);
      if (r)
        for (const i in r)
          t[i] = r[i];
    }
    return t;
  } else if (G(e) || K(e))
    return e;
}
const hi = /;(?![^(]*\))/g, di = /:([^]+)/, pi = /\/\*[^]*?\*\//g;
function gi(e) {
  const t = {};
  return e.replace(pi, "").split(hi).forEach((s) => {
    if (s) {
      const n = s.split(di);
      n.length > 1 && (t[n[0].trim()] = n[1].trim());
    }
  }), t;
}
function ht(e) {
  let t = "";
  if (G(e))
    t = e;
  else if (M(e))
    for (let s = 0; s < e.length; s++) {
      const n = ht(e[s]);
      n && (t += n + " ");
    }
  else if (K(e))
    for (const s in e)
      e[s] && (t += s + " ");
  return t.trim();
}
const _i = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", bi = /* @__PURE__ */ Ds(_i);
function zn(e) {
  return !!e || e === "";
}
function mi(e, t) {
  if (e.length !== t.length) return !1;
  let s = !0;
  for (let n = 0; s && n < e.length; n++)
    s = Vs(e[n], t[n]);
  return s;
}
function Vs(e, t) {
  if (e === t) return !0;
  let s = fn(e), n = fn(t);
  if (s || n)
    return s && n ? e.getTime() === t.getTime() : !1;
  if (s = Ne(e), n = Ne(t), s || n)
    return e === t;
  if (s = M(e), n = M(t), s || n)
    return s && n ? mi(e, t) : !1;
  if (s = K(e), n = K(t), s || n) {
    if (!s || !n)
      return !1;
    const r = Object.keys(e).length, i = Object.keys(t).length;
    if (r !== i)
      return !1;
    for (const o in e) {
      const l = e.hasOwnProperty(o), c = t.hasOwnProperty(o);
      if (l && !c || !l && c || !Vs(e[o], t[o]))
        return !1;
    }
  }
  return String(e) === String(t);
}
const Qn = (e) => !!(e && e.__v_isRef === !0), Te = (e) => G(e) ? e : e == null ? "" : M(e) || K(e) && (e.toString === kn || !I(e.toString)) ? Qn(e) ? Te(e.value) : JSON.stringify(e, Xn, 2) : String(e), Xn = (e, t) => Qn(t) ? Xn(e, t.value) : at(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (s, [n, r], i) => (s[ps(n, i) + " =>"] = r, s),
    {}
  )
} : Yn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((s) => ps(s))
} : Ne(t) ? ps(t) : K(t) && !M(t) && !rs(t) ? String(t) : t, ps = (e, t = "") => {
  var s;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Ne(e) ? `Symbol(${(s = e.description) != null ? s : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ee;
class vi {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && ee && (ee.active ? (this.parent = ee, this.index = (ee.scopes || (ee.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, s;
      if (this.scopes) {
        const n = this.scopes.slice();
        for (t = 0, s = n.length; t < s; t++)
          n[t].pause();
      }
      for (t = 0, s = this.effects.length; t < s; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, s;
      if (this.scopes) {
        const r = this.scopes.slice();
        for (t = 0, s = r.length; t < s; t++)
          r[t].resume();
      }
      const n = this.effects.slice();
      for (t = 0, s = n.length; t < s; t++)
        n[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const s = ee;
      try {
        return ee = this, t();
      } finally {
        ee = s;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = ee, ee = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (ee === this)
        ee = this.prevScope;
      else {
        let t = ee;
        for (; t; ) {
          if (t.prevScope === this) {
            t.prevScope = this.prevScope;
            break;
          }
          t = t.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(t) {
    if (this._active) {
      this._active = !1;
      let s, n;
      for (s = 0, n = this.effects.length; s < n; s++)
        this.effects[s].stop();
      for (this.effects.length = 0, s = 0, n = this.cleanups.length; s < n; s++)
        this.cleanups[s]();
      if (this.cleanups.length = 0, this.scopes) {
        const r = this.scopes.slice();
        for (s = 0, n = r.length; s < n; s++)
          r[s].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !t) {
        const r = this.parent.scopes.pop();
        r && r !== this && (this.parent.scopes[this.index] = r, r.index = this.index);
      }
      this.parent = void 0;
    }
  }
}
function yi() {
  return ee;
}
let k;
const gs = /* @__PURE__ */ new WeakSet();
class Zn {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, ee && (ee.active ? ee.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, gs.has(this) && (gs.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || tr(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, hn(this), sr(this);
    const t = k, s = _e;
    k = this, _e = !0;
    try {
      return this.fn();
    } finally {
      nr(this), k = t, _e = s, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        Bs(t);
      this.deps = this.depsTail = void 0, hn(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? gs.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    Cs(this) && this.run();
  }
  get dirty() {
    return Cs(this);
  }
}
let er = 0, Tt, At;
function tr(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = At, At = e;
    return;
  }
  e.next = Tt, Tt = e;
}
function Us() {
  er++;
}
function Ws() {
  if (--er > 0)
    return;
  if (At) {
    let t = At;
    for (At = void 0; t; ) {
      const s = t.next;
      t.next = void 0, t.flags &= -9, t = s;
    }
  }
  let e;
  for (; Tt; ) {
    let t = Tt;
    for (Tt = void 0; t; ) {
      const s = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (n) {
          e || (e = n);
        }
      t = s;
    }
  }
  if (e) throw e;
}
function sr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function nr(e) {
  let t, s = e.depsTail, n = s;
  for (; n; ) {
    const r = n.prevDep;
    n.version === -1 ? (n === s && (s = r), Bs(n), wi(n)) : t = n, n.dep.activeLink = n.prevActiveLink, n.prevActiveLink = void 0, n = r;
  }
  e.deps = t, e.depsTail = s;
}
function Cs(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (rr(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function rr(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Ft) || (e.globalVersion = Ft, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !Cs(e))))
    return;
  e.flags |= 2;
  const t = e.dep, s = k, n = _e;
  k = e, _e = !0;
  try {
    sr(e);
    const r = e.fn(e._value);
    (t.version === 0 || Pe(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    k = s, _e = n, nr(e), e.flags &= -3;
  }
}
function Bs(e, t = !1) {
  const { dep: s, prevSub: n, nextSub: r } = e;
  if (n && (n.nextSub = r, e.prevSub = void 0), r && (r.prevSub = n, e.nextSub = void 0), s.subs === e && (s.subs = n, !n && s.computed)) {
    s.computed.flags &= -5;
    for (let i = s.computed.deps; i; i = i.nextDep)
      Bs(i, !0);
  }
  !t && !--s.sc && s.map && s.map.delete(s.key);
}
function wi(e) {
  const { prevDep: t, nextDep: s } = e;
  t && (t.nextDep = s, e.prevDep = void 0), s && (s.prevDep = t, e.nextDep = void 0);
}
let _e = !0;
const ir = [];
function Ue() {
  ir.push(_e), _e = !1;
}
function We() {
  const e = ir.pop();
  _e = e === void 0 ? !0 : e;
}
function hn(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const s = k;
    k = void 0;
    try {
      t();
    } finally {
      k = s;
    }
  }
}
let Ft = 0;
class xi {
  constructor(t, s) {
    this.sub = t, this.dep = s, this.version = s.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Ks {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!k || !_e || k === this.computed)
      return;
    let s = this.activeLink;
    if (s === void 0 || s.sub !== k)
      s = this.activeLink = new xi(k, this), k.deps ? (s.prevDep = k.depsTail, k.depsTail.nextDep = s, k.depsTail = s) : k.deps = k.depsTail = s, or(s);
    else if (s.version === -1 && (s.version = this.version, s.nextDep)) {
      const n = s.nextDep;
      n.prevDep = s.prevDep, s.prevDep && (s.prevDep.nextDep = n), s.prevDep = k.depsTail, s.nextDep = void 0, k.depsTail.nextDep = s, k.depsTail = s, k.deps === s && (k.deps = n);
    }
    return s;
  }
  trigger(t) {
    this.version++, Ft++, this.notify(t);
  }
  notify(t) {
    Us();
    try {
      for (let s = this.subs; s; s = s.prevSub)
        s.sub.notify() && s.sub.dep.notify();
    } finally {
      Ws();
    }
  }
}
function or(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let n = t.deps; n; n = n.nextDep)
        or(n);
    }
    const s = e.dep.subs;
    s !== e && (e.prevSub = s, s && (s.nextSub = e)), e.dep.subs = e;
  }
}
const Ts = /* @__PURE__ */ new WeakMap(), nt = /* @__PURE__ */ Symbol(
  ""
), As = /* @__PURE__ */ Symbol(
  ""
), Nt = /* @__PURE__ */ Symbol(
  ""
);
function te(e, t, s) {
  if (_e && k) {
    let n = Ts.get(e);
    n || Ts.set(e, n = /* @__PURE__ */ new Map());
    let r = n.get(s);
    r || (n.set(s, r = new Ks()), r.map = n, r.key = s), r.track();
  }
}
function Ve(e, t, s, n, r, i) {
  const o = Ts.get(e);
  if (!o) {
    Ft++;
    return;
  }
  const l = (c) => {
    c && c.trigger();
  };
  if (Us(), t === "clear")
    o.forEach(l);
  else {
    const c = M(e), h = c && Hs(s);
    if (c && s === "length") {
      const a = Number(n);
      o.forEach((p, S) => {
        (S === "length" || S === Nt || !Ne(S) && S >= a) && l(p);
      });
    } else
      switch ((s !== void 0 || o.has(void 0)) && l(o.get(s)), h && l(o.get(Nt)), t) {
        case "add":
          c ? h && l(o.get("length")) : (l(o.get(nt)), at(e) && l(o.get(As)));
          break;
        case "delete":
          c || (l(o.get(nt)), at(e) && l(o.get(As)));
          break;
        case "set":
          at(e) && l(o.get(nt));
          break;
      }
  }
  Ws();
}
function ot(e) {
  const t = /* @__PURE__ */ $(e);
  return t === e ? t : (te(t, "iterate", Nt), /* @__PURE__ */ be(e) ? t : t.map(Be));
}
function Ys(e) {
  return te(e = /* @__PURE__ */ $(e), "iterate", Nt), e;
}
function Re(e, t) {
  return /* @__PURE__ */ Je(e) ? Lt(/* @__PURE__ */ dt(e) ? Be(t) : t) : Be(t);
}
const Si = {
  __proto__: null,
  [Symbol.iterator]() {
    return _s(this, Symbol.iterator, (e) => Re(this, e));
  },
  concat(...e) {
    return ot(this).concat(
      ...e.map((t) => M(t) ? ot(t) : t)
    );
  },
  entries() {
    return _s(this, "entries", (e) => (e[1] = Re(this, e[1]), e));
  },
  every(e, t) {
    return De(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return De(
      this,
      "filter",
      e,
      t,
      (s) => s.map((n) => Re(this, n)),
      arguments
    );
  },
  find(e, t) {
    return De(
      this,
      "find",
      e,
      t,
      (s) => Re(this, s),
      arguments
    );
  },
  findIndex(e, t) {
    return De(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return De(
      this,
      "findLast",
      e,
      t,
      (s) => Re(this, s),
      arguments
    );
  },
  findLastIndex(e, t) {
    return De(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return De(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return bs(this, "includes", e);
  },
  indexOf(...e) {
    return bs(this, "indexOf", e);
  },
  join(e) {
    return ot(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return bs(this, "lastIndexOf", e);
  },
  map(e, t) {
    return De(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return yt(this, "pop");
  },
  push(...e) {
    return yt(this, "push", e);
  },
  reduce(e, ...t) {
    return dn(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return dn(this, "reduceRight", e, t);
  },
  shift() {
    return yt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return De(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return yt(this, "splice", e);
  },
  toReversed() {
    return ot(this).toReversed();
  },
  toSorted(e) {
    return ot(this).toSorted(e);
  },
  toSpliced(...e) {
    return ot(this).toSpliced(...e);
  },
  unshift(...e) {
    return yt(this, "unshift", e);
  },
  values() {
    return _s(this, "values", (e) => Re(this, e));
  }
};
function _s(e, t, s) {
  const n = Ys(e), r = n[t]();
  return n !== e && !/* @__PURE__ */ be(e) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.done || (i.value = s(i.value)), i;
  }), r;
}
const Ei = Array.prototype;
function De(e, t, s, n, r, i) {
  const o = Ys(e), l = o !== e && !/* @__PURE__ */ be(e), c = o[t];
  if (c !== Ei[t]) {
    const p = c.apply(e, i);
    return l ? Be(p) : p;
  }
  let h = s;
  o !== e && (l ? h = function(p, S) {
    return s.call(this, Re(e, p), S, e);
  } : s.length > 2 && (h = function(p, S) {
    return s.call(this, p, S, e);
  }));
  const a = c.call(o, h, n);
  return l && r ? r(a) : a;
}
function dn(e, t, s, n) {
  const r = Ys(e), i = r !== e && !/* @__PURE__ */ be(e);
  let o = s, l = !1;
  r !== e && (i ? (l = n.length === 0, o = function(h, a, p) {
    return l && (l = !1, h = Re(e, h)), s.call(this, h, Re(e, a), p, e);
  }) : s.length > 3 && (o = function(h, a, p) {
    return s.call(this, h, a, p, e);
  }));
  const c = r[t](o, ...n);
  return l ? Re(e, c) : c;
}
function bs(e, t, s) {
  const n = /* @__PURE__ */ $(e);
  te(n, "iterate", Nt);
  const r = n[t](...s);
  return (r === -1 || r === !1) && /* @__PURE__ */ Gs(s[0]) ? (s[0] = /* @__PURE__ */ $(s[0]), n[t](...s)) : r;
}
function yt(e, t, s = []) {
  Ue(), Us();
  const n = (/* @__PURE__ */ $(e))[t].apply(e, s);
  return Ws(), We(), n;
}
const Ci = /* @__PURE__ */ Ds("__proto__,__v_isRef,__isVue"), lr = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Ne)
);
function Ti(e) {
  Ne(e) || (e = String(e));
  const t = /* @__PURE__ */ $(this);
  return te(t, "has", e), t.hasOwnProperty(e);
}
class cr {
  constructor(t = !1, s = !1) {
    this._isReadonly = t, this._isShallow = s;
  }
  get(t, s, n) {
    if (s === "__v_skip") return t.__v_skip;
    const r = this._isReadonly, i = this._isShallow;
    if (s === "__v_isReactive")
      return !r;
    if (s === "__v_isReadonly")
      return r;
    if (s === "__v_isShallow")
      return i;
    if (s === "__v_raw")
      return n === (r ? i ? Di : hr : i ? ar : ur).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(n) ? t : void 0;
    const o = M(t);
    if (!r) {
      let c;
      if (o && (c = Si[s]))
        return c;
      if (s === "hasOwnProperty")
        return Ti;
    }
    const l = Reflect.get(
      t,
      s,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ se(t) ? t : n
    );
    if ((Ne(s) ? lr.has(s) : Ci(s)) || (r || te(t, "get", s), i))
      return l;
    if (/* @__PURE__ */ se(l)) {
      const c = o && Hs(s) ? l : l.value;
      return r && K(c) ? /* @__PURE__ */ Os(c) : c;
    }
    return K(l) ? r ? /* @__PURE__ */ Os(l) : /* @__PURE__ */ ks(l) : l;
  }
}
class fr extends cr {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, s, n, r) {
    let i = t[s];
    const o = M(t) && Hs(s);
    if (!this._isShallow) {
      const h = /* @__PURE__ */ Je(i);
      if (!/* @__PURE__ */ be(n) && !/* @__PURE__ */ Je(n) && (i = /* @__PURE__ */ $(i), n = /* @__PURE__ */ $(n)), !o && /* @__PURE__ */ se(i) && !/* @__PURE__ */ se(n))
        return h || (i.value = n), !0;
    }
    const l = o ? Number(s) < t.length : H(t, s), c = Reflect.set(
      t,
      s,
      n,
      /* @__PURE__ */ se(t) ? t : r
    );
    return t === /* @__PURE__ */ $(r) && c && (l ? Pe(n, i) && Ve(t, "set", s, n) : Ve(t, "add", s, n)), c;
  }
  deleteProperty(t, s) {
    const n = H(t, s);
    t[s];
    const r = Reflect.deleteProperty(t, s);
    return r && n && Ve(t, "delete", s, void 0), r;
  }
  has(t, s) {
    const n = Reflect.has(t, s);
    return (!Ne(s) || !lr.has(s)) && te(t, "has", s), n;
  }
  ownKeys(t) {
    return te(
      t,
      "iterate",
      M(t) ? "length" : nt
    ), Reflect.ownKeys(t);
  }
}
class Ai extends cr {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, s) {
    return !0;
  }
  deleteProperty(t, s) {
    return !0;
  }
}
const Ri = /* @__PURE__ */ new fr(), Oi = /* @__PURE__ */ new Ai(), Pi = /* @__PURE__ */ new fr(!0);
const Rs = (e) => e, Kt = (e) => Reflect.getPrototypeOf(e);
function Mi(e, t, s) {
  return function(...n) {
    const r = this.__v_raw, i = /* @__PURE__ */ $(r), o = at(i), l = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, h = r[e](...n), a = s ? Rs : t ? Lt : Be;
    return !t && te(
      i,
      "iterate",
      c ? As : nt
    ), Q(
      // inheriting all iterator properties
      Object.create(h),
      {
        // iterator protocol
        next() {
          const { value: p, done: S } = h.next();
          return S ? { value: p, done: S } : {
            value: l ? [a(p[0]), a(p[1])] : a(p),
            done: S
          };
        }
      }
    );
  };
}
function Yt(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Ii(e, t) {
  const s = {
    get(r) {
      const i = this.__v_raw, o = /* @__PURE__ */ $(i), l = /* @__PURE__ */ $(r);
      e || (Pe(r, l) && te(o, "get", r), te(o, "get", l));
      const { has: c } = Kt(o), h = t ? Rs : e ? Lt : Be;
      if (c.call(o, r))
        return h(i.get(r));
      if (c.call(o, l))
        return h(i.get(l));
      i !== o && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && te(/* @__PURE__ */ $(r), "iterate", nt), r.size;
    },
    has(r) {
      const i = this.__v_raw, o = /* @__PURE__ */ $(i), l = /* @__PURE__ */ $(r);
      return e || (Pe(r, l) && te(o, "has", r), te(o, "has", l)), r === l ? i.has(r) : i.has(r) || i.has(l);
    },
    forEach(r, i) {
      const o = this, l = o.__v_raw, c = /* @__PURE__ */ $(l), h = t ? Rs : e ? Lt : Be;
      return !e && te(c, "iterate", nt), l.forEach((a, p) => r.call(i, h(a), h(p), o));
    }
  };
  return Q(
    s,
    e ? {
      add: Yt("add"),
      set: Yt("set"),
      delete: Yt("delete"),
      clear: Yt("clear")
    } : {
      add(r) {
        const i = /* @__PURE__ */ $(this), o = Kt(i), l = /* @__PURE__ */ $(r), c = !t && !/* @__PURE__ */ be(r) && !/* @__PURE__ */ Je(r) ? l : r;
        return o.has.call(i, c) || Pe(r, c) && o.has.call(i, r) || Pe(l, c) && o.has.call(i, l) || (i.add(c), Ve(i, "add", c, c)), this;
      },
      set(r, i) {
        !t && !/* @__PURE__ */ be(i) && !/* @__PURE__ */ Je(i) && (i = /* @__PURE__ */ $(i));
        const o = /* @__PURE__ */ $(this), { has: l, get: c } = Kt(o);
        let h = l.call(o, r);
        h || (r = /* @__PURE__ */ $(r), h = l.call(o, r));
        const a = c.call(o, r);
        return o.set(r, i), h ? Pe(i, a) && Ve(o, "set", r, i) : Ve(o, "add", r, i), this;
      },
      delete(r) {
        const i = /* @__PURE__ */ $(this), { has: o, get: l } = Kt(i);
        let c = o.call(i, r);
        c || (r = /* @__PURE__ */ $(r), c = o.call(i, r)), l && l.call(i, r);
        const h = i.delete(r);
        return c && Ve(i, "delete", r, void 0), h;
      },
      clear() {
        const r = /* @__PURE__ */ $(this), i = r.size !== 0, o = r.clear();
        return i && Ve(
          r,
          "clear",
          void 0,
          void 0
        ), o;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((r) => {
    s[r] = Mi(r, e, t);
  }), s;
}
function qs(e, t) {
  const s = Ii(e, t);
  return (n, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? n : Reflect.get(
    H(s, r) && r in n ? s : n,
    r,
    i
  );
}
const Fi = {
  get: /* @__PURE__ */ qs(!1, !1)
}, Ni = {
  get: /* @__PURE__ */ qs(!1, !0)
}, Li = {
  get: /* @__PURE__ */ qs(!0, !1)
};
const ur = /* @__PURE__ */ new WeakMap(), ar = /* @__PURE__ */ new WeakMap(), hr = /* @__PURE__ */ new WeakMap(), Di = /* @__PURE__ */ new WeakMap();
function ji(e) {
  switch (e) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
// @__NO_SIDE_EFFECTS__
function ks(e) {
  return /* @__PURE__ */ Je(e) ? e : Js(
    e,
    !1,
    Ri,
    Fi,
    ur
  );
}
// @__NO_SIDE_EFFECTS__
function Hi(e) {
  return Js(
    e,
    !1,
    Pi,
    Ni,
    ar
  );
}
// @__NO_SIDE_EFFECTS__
function Os(e) {
  return Js(
    e,
    !0,
    Oi,
    Li,
    hr
  );
}
function Js(e, t, s, n, r) {
  if (!K(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const i = r.get(e);
  if (i)
    return i;
  const o = ji(ci(e));
  if (o === 0)
    return e;
  const l = new Proxy(
    e,
    o === 2 ? n : s
  );
  return r.set(e, l), l;
}
// @__NO_SIDE_EFFECTS__
function dt(e) {
  return /* @__PURE__ */ Je(e) ? /* @__PURE__ */ dt(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function Je(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function be(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function Gs(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function $(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ $(t) : e;
}
function $i(e) {
  return !H(e, "__v_skip") && Object.isExtensible(e) && Gn(e, "__v_skip", !0), e;
}
const Be = (e) => K(e) ? /* @__PURE__ */ ks(e) : e, Lt = (e) => K(e) ? /* @__PURE__ */ Os(e) : e;
// @__NO_SIDE_EFFECTS__
function se(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function lt(e) {
  return Vi(e, !1);
}
function Vi(e, t) {
  return /* @__PURE__ */ se(e) ? e : new Ui(e, t);
}
class Ui {
  constructor(t, s) {
    this.dep = new Ks(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = s ? t : /* @__PURE__ */ $(t), this._value = s ? t : Be(t), this.__v_isShallow = s;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const s = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ be(t) || /* @__PURE__ */ Je(t);
    t = n ? t : /* @__PURE__ */ $(t), Pe(t, s) && (this._rawValue = t, this._value = n ? t : Be(t), this.dep.trigger());
  }
}
function dr(e) {
  return /* @__PURE__ */ se(e) ? e.value : e;
}
const Wi = {
  get: (e, t, s) => t === "__v_raw" ? e : dr(Reflect.get(e, t, s)),
  set: (e, t, s, n) => {
    const r = e[t];
    return /* @__PURE__ */ se(r) && !/* @__PURE__ */ se(s) ? (r.value = s, !0) : Reflect.set(e, t, s, n);
  }
};
function pr(e) {
  return /* @__PURE__ */ dt(e) ? e : new Proxy(e, Wi);
}
class Bi {
  constructor(t, s, n) {
    this.fn = t, this.setter = s, this._value = void 0, this.dep = new Ks(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Ft - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !s, this.isSSR = n;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    k !== this)
      return tr(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return rr(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Ki(e, t, s = !1) {
  let n, r;
  return I(e) ? n = e : (n = e.get, r = e.set), new Bi(n, r, s);
}
const qt = {}, Gt = /* @__PURE__ */ new WeakMap();
let st;
function Yi(e, t = !1, s = st) {
  if (s) {
    let n = Gt.get(s);
    n || Gt.set(s, n = []), n.push(e);
  }
}
function qi(e, t, s = J) {
  const { immediate: n, deep: r, once: i, scheduler: o, augmentJob: l, call: c } = s, h = (O) => r ? O : /* @__PURE__ */ be(O) || r === !1 || r === 0 ? ke(O, 1) : ke(O);
  let a, p, S, E, N = !1, T = !1;
  if (/* @__PURE__ */ se(e) ? (p = () => e.value, N = /* @__PURE__ */ be(e)) : /* @__PURE__ */ dt(e) ? (p = () => h(e), N = !0) : M(e) ? (T = !0, N = e.some((O) => /* @__PURE__ */ dt(O) || /* @__PURE__ */ be(O)), p = () => e.map((O) => {
    if (/* @__PURE__ */ se(O))
      return O.value;
    if (/* @__PURE__ */ dt(O))
      return h(O);
    if (I(O))
      return c ? c(O, 2) : O();
  })) : I(e) ? t ? p = c ? () => c(e, 2) : e : p = () => {
    if (S) {
      Ue();
      try {
        S();
      } finally {
        We();
      }
    }
    const O = st;
    st = a;
    try {
      return c ? c(e, 3, [E]) : e(E);
    } finally {
      st = O;
    }
  } : p = Ie, t && r) {
    const O = p, z = r === !0 ? 1 / 0 : r;
    p = () => ke(O(), z);
  }
  const Y = yi(), q = () => {
    a.stop(), Y && Y.active && js(Y.effects, a);
  };
  if (i && t) {
    const O = t;
    t = (...z) => {
      const fe = O(...z);
      return q(), fe;
    };
  }
  let L = T ? new Array(e.length).fill(qt) : qt;
  const W = (O) => {
    if (!(!(a.flags & 1) || !a.dirty && !O))
      if (t) {
        const z = a.run();
        if (O || r || N || (T ? z.some((fe, de) => Pe(fe, L[de])) : Pe(z, L))) {
          S && S();
          const fe = st;
          st = a;
          try {
            const de = [
              z,
              // pass undefined as the old value when it's changed for the first time
              L === qt ? void 0 : T && L[0] === qt ? [] : L,
              E
            ];
            L = z, c ? c(t, 3, de) : (
              // @ts-expect-error
              t(...de)
            );
          } finally {
            st = fe;
          }
        }
      } else
        a.run();
  };
  return l && l(W), a = new Zn(p), a.scheduler = o ? () => o(W, !1) : W, E = (O) => Yi(O, !1, a), S = a.onStop = () => {
    const O = Gt.get(a);
    if (O) {
      if (c)
        c(O, 4);
      else
        for (const z of O) z();
      Gt.delete(a);
    }
  }, t ? n ? W(!0) : L = a.run() : o ? o(W.bind(null, !0), !0) : a.run(), q.pause = a.pause.bind(a), q.resume = a.resume.bind(a), q.stop = q, q;
}
function ke(e, t = 1 / 0, s) {
  if (t <= 0 || !K(e) || e.__v_skip || (s = s || /* @__PURE__ */ new Map(), (s.get(e) || 0) >= t))
    return e;
  if (s.set(e, t), t--, /* @__PURE__ */ se(e))
    ke(e.value, t, s);
  else if (M(e))
    for (let n = 0; n < e.length; n++)
      ke(e[n], t, s);
  else if (Yn(e) || at(e))
    e.forEach((n) => {
      ke(n, t, s);
    });
  else if (rs(e)) {
    for (const n in e)
      ke(e[n], t, s);
    for (const n of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, n) && ke(e[n], t, s);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function Vt(e, t, s, n) {
  try {
    return n ? e(...n) : e();
  } catch (r) {
    ls(r, t, s);
  }
}
function me(e, t, s, n) {
  if (I(e)) {
    const r = Vt(e, t, s, n);
    return r && qn(r) && r.catch((i) => {
      ls(i, t, s);
    }), r;
  }
  if (M(e)) {
    const r = [];
    for (let i = 0; i < e.length; i++)
      r.push(me(e[i], t, s, n));
    return r;
  }
}
function ls(e, t, s, n = !0) {
  const r = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: o } = t && t.appContext.config || J;
  if (t) {
    let l = t.parent;
    const c = t.proxy, h = `https://vuejs.org/error-reference/#runtime-${s}`;
    for (; l; ) {
      const a = l.ec;
      if (a) {
        for (let p = 0; p < a.length; p++)
          if (a[p](e, c, h) === !1)
            return;
      }
      l = l.parent;
    }
    if (i) {
      Ue(), Vt(i, null, 10, [
        e,
        c,
        h
      ]), We();
      return;
    }
  }
  ki(e, s, r, n, o);
}
function ki(e, t, s, n = !0, r = !1) {
  if (r)
    throw e;
  console.error(e);
}
const re = [];
let Ae = -1;
const pt = [];
let qe = null, ct = 0;
const gr = /* @__PURE__ */ Promise.resolve();
let zt = null;
function _r(e) {
  const t = zt || gr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Ji(e) {
  let t = Ae + 1, s = re.length;
  for (; t < s; ) {
    const n = t + s >>> 1, r = re[n], i = Dt(r);
    i < e || i === e && r.flags & 2 ? t = n + 1 : s = n;
  }
  return t;
}
function zs(e) {
  if (!(e.flags & 1)) {
    const t = Dt(e), s = re[re.length - 1];
    !s || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Dt(s) ? re.push(e) : re.splice(Ji(t), 0, e), e.flags |= 1, br();
  }
}
function br() {
  zt || (zt = gr.then(vr));
}
function Gi(e) {
  M(e) ? pt.push(...e) : qe && e.id === -1 ? qe.splice(ct + 1, 0, e) : e.flags & 1 || (pt.push(e), e.flags |= 1), br();
}
function pn(e, t, s = Ae + 1) {
  for (; s < re.length; s++) {
    const n = re[s];
    if (n && n.flags & 2) {
      if (e && n.id !== e.uid)
        continue;
      re.splice(s, 1), s--, n.flags & 4 && (n.flags &= -2), n(), n.flags & 4 || (n.flags &= -2);
    }
  }
}
function mr(e) {
  if (pt.length) {
    const t = [...new Set(pt)].sort(
      (s, n) => Dt(s) - Dt(n)
    );
    if (pt.length = 0, qe) {
      qe.push(...t);
      return;
    }
    for (qe = t, ct = 0; ct < qe.length; ct++) {
      const s = qe[ct];
      s.flags & 4 && (s.flags &= -2), s.flags & 8 || s(), s.flags &= -2;
    }
    qe = null, ct = 0;
  }
}
const Dt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function vr(e) {
  try {
    for (Ae = 0; Ae < re.length; Ae++) {
      const t = re[Ae];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), Vt(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Ae < re.length; Ae++) {
      const t = re[Ae];
      t && (t.flags &= -2);
    }
    Ae = -1, re.length = 0, mr(), zt = null, (re.length || pt.length) && vr();
  }
}
let Me = null, yr = null;
function Qt(e) {
  const t = Me;
  return Me = e, yr = e && e.type.__scopeId || null, t;
}
function zi(e, t = Me, s) {
  if (!t || e._n)
    return e;
  const n = (...r) => {
    n._d && Cn(-1);
    const i = Qt(t), o = rt.length;
    let l;
    try {
      l = e(...r);
    } finally {
      for (let c = rt.length; c > o; c--) kr();
      Qt(i), n._d && Cn(1);
    }
    return l;
  };
  return n._n = !0, n._c = !0, n._d = !0, n;
}
function et(e, t, s, n) {
  const r = e.dirs, i = t && t.dirs;
  for (let o = 0; o < r.length; o++) {
    const l = r[o];
    i && (l.oldValue = i[o].value);
    let c = l.dir[n];
    c && (Ue(), me(c, s, 8, [
      e.el,
      l,
      e,
      t
    ]), We());
  }
}
function Qi(e, t) {
  if (ie) {
    let s = ie.provides;
    const n = ie.parent && ie.parent.provides;
    n === s && (s = ie.provides = Object.create(n)), s[e] = t;
  }
}
function kt(e, t, s = !1) {
  const n = Jo();
  if (n || gt) {
    let r = gt ? gt._context.provides : n ? n.parent == null || n.ce ? n.vnode.appContext && n.vnode.appContext.provides : n.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return s && I(t) ? t.call(n && n.proxy) : t;
  }
}
const Xi = /* @__PURE__ */ Symbol.for("v-scx"), Zi = () => kt(Xi);
function ms(e, t, s) {
  return wr(e, t, s);
}
function wr(e, t, s = J) {
  const { immediate: n, deep: r, flush: i, once: o } = s, l = Q({}, s), c = t && n || !t && i !== "post";
  let h;
  if (Ht) {
    if (i === "sync") {
      const E = Zi();
      h = E.__watcherHandles || (E.__watcherHandles = []);
    } else if (!c) {
      const E = () => {
      };
      return E.stop = Ie, E.resume = Ie, E.pause = Ie, E;
    }
  }
  const a = ie;
  l.call = (E, N, T) => me(E, a, N, T);
  let p = !1;
  i === "post" ? l.scheduler = (E) => {
    oe(E, a && a.suspense);
  } : i !== "sync" && (p = !0, l.scheduler = (E, N) => {
    N ? E() : zs(E);
  }), l.augmentJob = (E) => {
    t && (E.flags |= 4), p && (E.flags |= 2, a && (E.id = a.uid, E.i = a));
  };
  const S = qi(e, t, l);
  return Ht && (h ? h.push(S) : c && S()), S;
}
function eo(e, t, s) {
  const n = this.proxy, r = G(e) ? e.includes(".") ? xr(n, e) : () => n[e] : e.bind(n, n);
  let i;
  I(t) ? i = t : (i = t.handler, s = t);
  const o = Ut(this), l = wr(r, i.bind(n), s);
  return o(), l;
}
function xr(e, t) {
  const s = t.split(".");
  return () => {
    let n = e;
    for (let r = 0; r < s.length && n; r++)
      n = n[s[r]];
    return n;
  };
}
const to = /* @__PURE__ */ Symbol("_vte"), so = (e) => e.__isTeleport, vs = /* @__PURE__ */ Symbol("_leaveCb");
function Qs(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, Qs(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Sr(e, t) {
  return I(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    Q({ name: e.name }, t, { setup: e })
  ) : e;
}
function Er(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function gn(e, t) {
  let s;
  return !!((s = Object.getOwnPropertyDescriptor(e, t)) && !s.configurable);
}
const Xt = /* @__PURE__ */ new WeakMap();
function Rt(e, t, s, n, r = !1) {
  if (M(e)) {
    e.forEach(
      (T, Y) => Rt(
        T,
        t && (M(t) ? t[Y] : t),
        s,
        n,
        r
      )
    );
    return;
  }
  if (Ot(n) && !r) {
    n.shapeFlag & 512 && n.type.__asyncResolved && n.component.subTree.component && Rt(e, t, s, n.component.subTree);
    return;
  }
  const i = n.shapeFlag & 4 ? en(n.component) : n.el, o = r ? null : i, { i: l, r: c } = e, h = t && t.r, a = l.refs === J ? l.refs = {} : l.refs, p = l.setupState, S = /* @__PURE__ */ $(p), E = p === J ? Kn : (T) => gn(a, T) ? !1 : H(S, T), N = (T, Y) => !(Y && gn(a, Y));
  if (h != null && h !== c) {
    if (_n(t), G(h))
      a[h] = null, E(h) && (p[h] = null);
    else if (/* @__PURE__ */ se(h)) {
      const T = t;
      N(h, T.k) && (h.value = null), T.k && (a[T.k] = null);
    }
  }
  if (I(c))
    Vt(c, l, 12, [o, a]);
  else {
    const T = G(c), Y = /* @__PURE__ */ se(c);
    if (T || Y) {
      const q = () => {
        if (e.f) {
          const L = T ? E(c) ? p[c] : a[c] : N() || !e.k ? c.value : a[e.k];
          if (r)
            M(L) && js(L, i);
          else if (M(L))
            L.includes(i) || L.push(i);
          else if (T)
            a[c] = [i], E(c) && (p[c] = a[c]);
          else {
            const W = [i];
            N(c, e.k) && (c.value = W), e.k && (a[e.k] = W);
          }
        } else T ? (a[c] = o, E(c) && (p[c] = o)) : Y && (N(c, e.k) && (c.value = o), e.k && (a[e.k] = o));
      };
      if (o) {
        const L = () => {
          q(), Xt.delete(e);
        };
        L.id = -1, Xt.set(e, L), oe(L, s);
      } else
        _n(e), q();
    }
  }
}
function _n(e) {
  const t = Xt.get(e);
  t && (t.flags |= 8, Xt.delete(e));
}
os().requestIdleCallback;
os().cancelIdleCallback;
const Ot = (e) => !!e.type.__asyncLoader, Cr = (e) => e.type.__isKeepAlive;
function no(e, t) {
  Tr(e, "a", t);
}
function ro(e, t) {
  Tr(e, "da", t);
}
function Tr(e, t, s = ie) {
  const n = e.__wdc || (e.__wdc = () => {
    let r = s;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (cs(t, n, s), s) {
    let r = s.parent;
    for (; r && r.parent; )
      Cr(r.parent.vnode) && io(n, t, s, r), r = r.parent;
  }
}
function io(e, t, s, n) {
  const r = cs(
    t,
    e,
    n,
    !0
    /* prepend */
  );
  Or(() => {
    js(n[t], r);
  }, s);
}
function cs(e, t, s = ie, n = !1) {
  if (s) {
    const r = s[e] || (s[e] = []), i = t.__weh || (t.__weh = (...o) => {
      Ue();
      const l = Ut(s), c = me(t, s, e, o);
      return l(), We(), c;
    });
    return n ? r.unshift(i) : r.push(i), i;
  }
}
const Ke = (e) => (t, s = ie) => {
  (!Ht || e === "sp") && cs(e, (...n) => t(...n), s);
}, oo = Ke("bm"), Ar = Ke("m"), lo = Ke(
  "bu"
), co = Ke("u"), Rr = Ke(
  "bum"
), Or = Ke("um"), fo = Ke(
  "sp"
), uo = Ke("rtg"), ao = Ke("rtc");
function ho(e, t = ie) {
  cs("ec", e, t);
}
const po = /* @__PURE__ */ Symbol.for("v-ndc"), Ps = (e) => e ? Xr(e) ? en(e) : Ps(e.parent) : null, Pt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ Q(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => Ps(e.parent),
    $root: (e) => Ps(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Mr(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      zs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = _r.bind(e.proxy)),
    $watch: (e) => eo.bind(e)
  })
), ys = (e, t) => e !== J && !e.__isScriptSetup && H(e, t), go = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: s, setupState: n, data: r, props: i, accessCache: o, type: l, appContext: c } = e;
    if (t[0] !== "$") {
      const S = o[t];
      if (S !== void 0)
        switch (S) {
          case 1:
            return n[t];
          case 2:
            return r[t];
          case 4:
            return s[t];
          case 3:
            return i[t];
        }
      else {
        if (ys(n, t))
          return o[t] = 1, n[t];
        if (r !== J && H(r, t))
          return o[t] = 2, r[t];
        if (H(i, t))
          return o[t] = 3, i[t];
        if (s !== J && H(s, t))
          return o[t] = 4, s[t];
        Ms && (o[t] = 0);
      }
    }
    const h = Pt[t];
    let a, p;
    if (h)
      return t === "$attrs" && te(e.attrs, "get", ""), h(e);
    if (
      // css module (injected by vue-loader)
      (a = l.__cssModules) && (a = a[t])
    )
      return a;
    if (s !== J && H(s, t))
      return o[t] = 4, s[t];
    if (
      // global properties
      p = c.config.globalProperties, H(p, t)
    )
      return p[t];
  },
  set({ _: e }, t, s) {
    const { data: n, setupState: r, ctx: i } = e;
    return ys(r, t) ? (r[t] = s, !0) : n !== J && H(n, t) ? (n[t] = s, !0) : H(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = s, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: s, ctx: n, appContext: r, props: i, type: o }
  }, l) {
    let c;
    return !!(s[l] || e !== J && l[0] !== "$" && H(e, l) || ys(t, l) || H(i, l) || H(n, l) || H(Pt, l) || H(r.config.globalProperties, l) || (c = o.__cssModules) && c[l]);
  },
  defineProperty(e, t, s) {
    return s.get != null ? e._.accessCache[t] = 0 : H(s, "value") && this.set(e, t, s.value, null), Reflect.defineProperty(e, t, s);
  }
};
function bn(e) {
  return M(e) ? e.reduce(
    (t, s) => (t[s] = null, t),
    {}
  ) : e;
}
let Ms = !0;
function _o(e) {
  const t = Mr(e), s = e.proxy, n = e.ctx;
  Ms = !1, t.beforeCreate && mn(t.beforeCreate, e, "bc");
  const {
    // state
    data: r,
    computed: i,
    methods: o,
    watch: l,
    provide: c,
    inject: h,
    // lifecycle
    created: a,
    beforeMount: p,
    mounted: S,
    beforeUpdate: E,
    updated: N,
    activated: T,
    deactivated: Y,
    beforeDestroy: q,
    beforeUnmount: L,
    destroyed: W,
    unmounted: O,
    render: z,
    renderTracked: fe,
    renderTriggered: de,
    errorCaptured: ue,
    serverPrefetch: Le,
    // public API
    expose: ve,
    inheritAttrs: ge,
    // assets
    components: it,
    directives: ze,
    filters: Qe
  } = t;
  if (h && bo(h, n, null), o)
    for (const A in o) {
      const D = o[A];
      I(D) && (n[A] = D.bind(s));
    }
  if (r) {
    const A = r.call(s, s);
    K(A) && (e.data = /* @__PURE__ */ ks(A));
  }
  if (Ms = !0, i)
    for (const A in i) {
      const D = i[A], ye = I(D) ? D.bind(s, s) : I(D.get) ? D.get.bind(s, s) : Ie, Wt = !I(D) && I(D.set) ? D.set.bind(s) : Ie, Ze = Ye({
        get: ye,
        set: Wt
      });
      Object.defineProperty(n, A, {
        enumerable: !0,
        configurable: !0,
        get: () => Ze.value,
        set: (we) => Ze.value = we
      });
    }
  if (l)
    for (const A in l)
      Pr(l[A], n, s, A);
  if (c) {
    const A = I(c) ? c.call(s) : c;
    Reflect.ownKeys(A).forEach((D) => {
      Qi(D, A[D]);
    });
  }
  a && mn(a, e, "c");
  function F(A, D) {
    M(D) ? D.forEach((ye) => A(ye.bind(s))) : D && A(D.bind(s));
  }
  if (F(oo, p), F(Ar, S), F(lo, E), F(co, N), F(no, T), F(ro, Y), F(ho, ue), F(ao, fe), F(uo, de), F(Rr, L), F(Or, O), F(fo, Le), M(ve))
    if (ve.length) {
      const A = e.exposed || (e.exposed = {});
      ve.forEach((D) => {
        Object.defineProperty(A, D, {
          get: () => s[D],
          set: (ye) => s[D] = ye,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  z && e.render === Ie && (e.render = z), ge != null && (e.inheritAttrs = ge), it && (e.components = it), ze && (e.directives = ze), Le && Er(e);
}
function bo(e, t, s = Ie) {
  M(e) && (e = Is(e));
  for (const n in e) {
    const r = e[n];
    let i;
    K(r) ? "default" in r ? i = kt(
      r.from || n,
      r.default,
      !0
    ) : i = kt(r.from || n) : i = kt(r), /* @__PURE__ */ se(i) ? Object.defineProperty(t, n, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (o) => i.value = o
    }) : t[n] = i;
  }
}
function mn(e, t, s) {
  me(
    M(e) ? e.map((n) => n.bind(t.proxy)) : e.bind(t.proxy),
    t,
    s
  );
}
function Pr(e, t, s, n) {
  let r = n.includes(".") ? xr(s, n) : () => s[n];
  if (G(e)) {
    const i = t[e];
    I(i) && ms(r, i);
  } else if (I(e))
    ms(r, e.bind(s));
  else if (K(e))
    if (M(e))
      e.forEach((i) => Pr(i, t, s, n));
    else {
      const i = I(e.handler) ? e.handler.bind(s) : t[e.handler];
      I(i) && ms(r, i, e);
    }
}
function Mr(e) {
  const t = e.type, { mixins: s, extends: n } = t, {
    mixins: r,
    optionsCache: i,
    config: { optionMergeStrategies: o }
  } = e.appContext, l = i.get(t);
  let c;
  return l ? c = l : !r.length && !s && !n ? c = t : (c = {}, r.length && r.forEach(
    (h) => Zt(c, h, o, !0)
  ), Zt(c, t, o)), K(t) && i.set(t, c), c;
}
function Zt(e, t, s, n = !1) {
  const { mixins: r, extends: i } = t;
  i && Zt(e, i, s, !0), r && r.forEach(
    (o) => Zt(e, o, s, !0)
  );
  for (const o in t)
    if (!(n && o === "expose")) {
      const l = mo[o] || s && s[o];
      e[o] = l ? l(e[o], t[o]) : t[o];
    }
  return e;
}
const mo = {
  data: vn,
  props: yn,
  emits: yn,
  // objects
  methods: St,
  computed: St,
  // lifecycle
  beforeCreate: ne,
  created: ne,
  beforeMount: ne,
  mounted: ne,
  beforeUpdate: ne,
  updated: ne,
  beforeDestroy: ne,
  beforeUnmount: ne,
  destroyed: ne,
  unmounted: ne,
  activated: ne,
  deactivated: ne,
  errorCaptured: ne,
  serverPrefetch: ne,
  // assets
  components: St,
  directives: St,
  // watch
  watch: yo,
  // provide / inject
  provide: vn,
  inject: vo
};
function vn(e, t) {
  return t ? e ? function() {
    return Q(
      I(e) ? e.call(this, this) : e,
      I(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function vo(e, t) {
  return St(Is(e), Is(t));
}
function Is(e) {
  if (M(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++)
      t[e[s]] = e[s];
    return t;
  }
  return e;
}
function ne(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function St(e, t) {
  return e ? Q(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function yn(e, t) {
  return e ? M(e) && M(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : Q(
    /* @__PURE__ */ Object.create(null),
    bn(e),
    bn(t ?? {})
  ) : t;
}
function yo(e, t) {
  if (!e) return t;
  if (!t) return e;
  const s = Q(/* @__PURE__ */ Object.create(null), e);
  for (const n in t)
    s[n] = ne(e[n], t[n]);
  return s;
}
function Ir() {
  return {
    app: null,
    config: {
      isNativeTag: Kn,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: /* @__PURE__ */ Object.create(null),
    optionsCache: /* @__PURE__ */ new WeakMap(),
    propsCache: /* @__PURE__ */ new WeakMap(),
    emitsCache: /* @__PURE__ */ new WeakMap()
  };
}
let wo = 0;
function xo(e, t) {
  return function(n, r = null) {
    I(n) || (n = Q({}, n)), r != null && !K(r) && (r = null);
    const i = Ir(), o = /* @__PURE__ */ new WeakSet(), l = [];
    let c = !1;
    const h = i.app = {
      _uid: wo++,
      _component: n,
      _props: r,
      _container: null,
      _context: i,
      _instance: null,
      version: el,
      get config() {
        return i.config;
      },
      set config(a) {
      },
      use(a, ...p) {
        return o.has(a) || (a && I(a.install) ? (o.add(a), a.install(h, ...p)) : I(a) && (o.add(a), a(h, ...p))), h;
      },
      mixin(a) {
        return i.mixins.includes(a) || i.mixins.push(a), h;
      },
      component(a, p) {
        return p ? (i.components[a] = p, h) : i.components[a];
      },
      directive(a, p) {
        return p ? (i.directives[a] = p, h) : i.directives[a];
      },
      mount(a, p, S) {
        if (!c) {
          const E = h._ceVNode || Fe(n, r);
          return E.appContext = i, S === !0 ? S = "svg" : S === !1 && (S = void 0), e(E, a, S), c = !0, h._container = a, a.__vue_app__ = h, en(E.component);
        }
      },
      onUnmount(a) {
        l.push(a);
      },
      unmount() {
        c && (me(
          l,
          h._instance,
          16
        ), e(null, h._container), delete h._container.__vue_app__);
      },
      provide(a, p) {
        return i.provides[a] = p, h;
      },
      runWithContext(a) {
        const p = gt;
        gt = h;
        try {
          return a();
        } finally {
          gt = p;
        }
      }
    };
    return h;
  };
}
let gt = null;
const So = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${ce(t)}Modifiers`] || e[`${pe(t)}Modifiers`];
function Eo(e, t, ...s) {
  if (e.isUnmounted) return;
  const n = e.vnode.props || J;
  let r = s;
  const i = t.startsWith("update:"), o = i && So(n, t.slice(7));
  o && (o.trim && (r = s.map((a) => G(a) ? a.trim() : a)), o.number && (r = s.map(ai)));
  let l, c = n[l = hs(t)] || // also try camelCase event handler (#2249)
  n[l = hs(ce(t))];
  !c && i && (c = n[l = hs(pe(t))]), c && me(
    c,
    e,
    6,
    r
  );
  const h = n[l + "Once"];
  if (h) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[l])
      return;
    e.emitted[l] = !0, me(
      h,
      e,
      6,
      r
    );
  }
}
const Co = /* @__PURE__ */ new WeakMap();
function Fr(e, t, s = !1) {
  const n = s ? Co : t.emitsCache, r = n.get(e);
  if (r !== void 0)
    return r;
  const i = e.emits;
  let o = {}, l = !1;
  if (!I(e)) {
    const c = (h) => {
      const a = Fr(h, t, !0);
      a && (l = !0, Q(o, a));
    };
    !s && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  return !i && !l ? (K(e) && n.set(e, null), null) : (M(i) ? i.forEach((c) => o[c] = null) : Q(o, i), K(e) && n.set(e, o), o);
}
function fs(e, t) {
  return !e || !ss(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), H(e, t[0].toLowerCase() + t.slice(1)) || H(e, pe(t)) || H(e, t));
}
function wn(e) {
  const {
    type: t,
    vnode: s,
    proxy: n,
    withProxy: r,
    propsOptions: [i],
    slots: o,
    attrs: l,
    emit: c,
    render: h,
    renderCache: a,
    props: p,
    data: S,
    setupState: E,
    ctx: N,
    inheritAttrs: T
  } = e, Y = Qt(e);
  let q, L;
  try {
    if (s.shapeFlag & 4) {
      const O = r || n, z = O;
      q = Oe(
        h.call(
          z,
          O,
          a,
          p,
          E,
          S,
          N
        )
      ), L = l;
    } else {
      const O = t;
      q = Oe(
        O.length > 1 ? O(
          p,
          { attrs: l, slots: o, emit: c }
        ) : O(
          p,
          null
        )
      ), L = t.props ? l : To(l);
    }
  } catch (O) {
    rt.length = 0, ls(O, e, 1), q = Fe(Ge);
  }
  let W = q;
  if (L && T !== !1) {
    const O = Object.keys(L), { shapeFlag: z } = W;
    O.length && z & 7 && (i && O.some(ns) && (L = Ao(
      L,
      i
    )), W = _t(W, L, !1, !0));
  }
  return s.dirs && (W = _t(W, null, !1, !0), W.dirs = W.dirs ? W.dirs.concat(s.dirs) : s.dirs), s.transition && Qs(W, s.transition), q = W, Qt(Y), q;
}
const To = (e) => {
  let t;
  for (const s in e)
    (s === "class" || s === "style" || ss(s)) && ((t || (t = {}))[s] = e[s]);
  return t;
}, Ao = (e, t) => {
  const s = {};
  for (const n in e)
    (!ns(n) || !(n.slice(9) in t)) && (s[n] = e[n]);
  return s;
};
function Ro(e, t, s) {
  const { props: n, children: r, component: i } = e, { props: o, children: l, patchFlag: c } = t, h = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (s && c >= 0) {
    if (c & 1024)
      return !0;
    if (c & 16)
      return n ? xn(n, o, h) : !!o;
    if (c & 8) {
      const a = t.dynamicProps;
      for (let p = 0; p < a.length; p++) {
        const S = a[p];
        if (Nr(o, n, S) && !fs(h, S))
          return !0;
      }
    }
  } else
    return (r || l) && (!l || !l.$stable) ? !0 : n === o ? !1 : n ? o ? xn(n, o, h) : !0 : !!o;
  return !1;
}
function xn(e, t, s) {
  const n = Object.keys(t);
  if (n.length !== Object.keys(e).length)
    return !0;
  for (let r = 0; r < n.length; r++) {
    const i = n[r];
    if (Nr(t, e, i) && !fs(s, i))
      return !0;
  }
  return !1;
}
function Nr(e, t, s) {
  const n = e[s], r = t[s];
  return s === "style" && K(n) && K(r) ? !Vs(n, r) : n !== r;
}
function Oo({ vnode: e, parent: t, suspense: s }, n) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.suspense.vnode.el = r.el = n, e = r), r === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
  s && s.activeBranch === e && (s.vnode.el = n);
}
const Lr = {}, Dr = () => Object.create(Lr), jr = (e) => Object.getPrototypeOf(e) === Lr;
function Po(e, t, s, n = !1) {
  const r = {}, i = Dr();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), Hr(e, t, r, i);
  for (const o in e.propsOptions[0])
    o in r || (r[o] = void 0);
  s ? e.props = n ? r : /* @__PURE__ */ Hi(r) : e.type.props ? e.props = r : e.props = i, e.attrs = i;
}
function Mo(e, t, s, n) {
  const {
    props: r,
    attrs: i,
    vnode: { patchFlag: o }
  } = e, l = /* @__PURE__ */ $(r), [c] = e.propsOptions;
  let h = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (n || o > 0) && !(o & 16)
  ) {
    if (o & 8) {
      const a = e.vnode.dynamicProps;
      for (let p = 0; p < a.length; p++) {
        let S = a[p];
        if (fs(e.emitsOptions, S))
          continue;
        const E = t[S];
        if (c)
          if (H(i, S))
            E !== i[S] && (i[S] = E, h = !0);
          else {
            const N = ce(S);
            r[N] = Fs(
              c,
              l,
              N,
              E,
              e,
              !1
            );
          }
        else
          E !== i[S] && (i[S] = E, h = !0);
      }
    }
  } else {
    Hr(e, t, r, i) && (h = !0);
    let a;
    for (const p in l)
      (!t || // for camelCase
      !H(t, p) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((a = pe(p)) === p || !H(t, a))) && (c ? s && // for camelCase
      (s[p] !== void 0 || // for kebab-case
      s[a] !== void 0) && (r[p] = Fs(
        c,
        l,
        p,
        void 0,
        e,
        !0
      )) : delete r[p]);
    if (i !== l)
      for (const p in i)
        (!t || !H(t, p)) && (delete i[p], h = !0);
  }
  h && Ve(e.attrs, "set", "");
}
function Hr(e, t, s, n) {
  const [r, i] = e.propsOptions;
  let o = !1, l;
  if (t)
    for (let c in t) {
      if (Ct(c))
        continue;
      const h = t[c];
      let a;
      r && H(r, a = ce(c)) ? !i || !i.includes(a) ? s[a] = h : (l || (l = {}))[a] = h : fs(e.emitsOptions, c) || (!(c in n) || h !== n[c]) && (n[c] = h, o = !0);
    }
  if (i) {
    const c = /* @__PURE__ */ $(s), h = l || J;
    for (let a = 0; a < i.length; a++) {
      const p = i[a];
      s[p] = Fs(
        r,
        c,
        p,
        h[p],
        e,
        !H(h, p)
      );
    }
  }
  return o;
}
function Fs(e, t, s, n, r, i) {
  const o = e[s];
  if (o != null) {
    const l = H(o, "default");
    if (l && n === void 0) {
      const c = o.default;
      if (o.type !== Function && !o.skipFactory && I(c)) {
        const { propsDefaults: h } = r;
        if (s in h)
          n = h[s];
        else {
          const a = Ut(r);
          n = h[s] = c.call(
            null,
            t
          ), a();
        }
      } else
        n = c;
      r.ce && r.ce._setProp(s, n);
    }
    o[
      0
      /* shouldCast */
    ] && (i && !l ? n = !1 : o[
      1
      /* shouldCastTrue */
    ] && (n === "" || n === pe(s)) && (n = !0));
  }
  return n;
}
const Io = /* @__PURE__ */ new WeakMap();
function $r(e, t, s = !1) {
  const n = s ? Io : t.propsCache, r = n.get(e);
  if (r)
    return r;
  const i = e.props, o = {}, l = [];
  let c = !1;
  if (!I(e)) {
    const a = (p) => {
      c = !0;
      const [S, E] = $r(p, t, !0);
      Q(o, S), E && l.push(...E);
    };
    !s && t.mixins.length && t.mixins.forEach(a), e.extends && a(e.extends), e.mixins && e.mixins.forEach(a);
  }
  if (!i && !c)
    return K(e) && n.set(e, ut), ut;
  if (M(i))
    for (let a = 0; a < i.length; a++) {
      const p = ce(i[a]);
      Sn(p) && (o[p] = J);
    }
  else if (i)
    for (const a in i) {
      const p = ce(a);
      if (Sn(p)) {
        const S = i[a], E = o[p] = M(S) || I(S) ? { type: S } : Q({}, S), N = E.type;
        let T = !1, Y = !0;
        if (M(N))
          for (let q = 0; q < N.length; ++q) {
            const L = N[q], W = I(L) && L.name;
            if (W === "Boolean") {
              T = !0;
              break;
            } else W === "String" && (Y = !1);
          }
        else
          T = I(N) && N.name === "Boolean";
        E[
          0
          /* shouldCast */
        ] = T, E[
          1
          /* shouldCastTrue */
        ] = Y, (T || H(E, "default")) && l.push(p);
      }
    }
  const h = [o, l];
  return K(e) && n.set(e, h), h;
}
function Sn(e) {
  return e[0] !== "$" && !Ct(e);
}
const Xs = (e) => e === "_" || e === "_ctx" || e === "$stable", Zs = (e) => M(e) ? e.map(Oe) : [Oe(e)], Fo = (e, t, s) => {
  if (t._n)
    return t;
  const n = zi((...r) => Zs(t(...r)), s);
  return n._c = !1, n;
}, Vr = (e, t, s) => {
  const n = e._ctx;
  for (const r in e) {
    if (Xs(r)) continue;
    const i = e[r];
    if (I(i))
      t[r] = Fo(r, i, n);
    else if (i != null) {
      const o = Zs(i);
      t[r] = () => o;
    }
  }
}, Ur = (e, t) => {
  const s = Zs(t);
  e.slots.default = () => s;
}, Wr = (e, t, s) => {
  for (const n in t)
    (s || !Xs(n)) && (e[n] = t[n]);
}, No = (e, t, s) => {
  const n = e.slots = Dr();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (Wr(n, t, s), s && Gn(n, "_", r, !0)) : Vr(t, n);
  } else t && Ur(e, t);
}, Lo = (e, t, s) => {
  const { vnode: n, slots: r } = e;
  let i = !0, o = J;
  if (n.shapeFlag & 32) {
    const l = t._;
    l ? s && l === 1 ? i = !1 : Wr(r, t, s) : (i = !t.$stable, Vr(t, r)), o = t;
  } else t && (Ur(e, t), o = { default: 1 });
  if (i)
    for (const l in r)
      !Xs(l) && o[l] == null && delete r[l];
}, oe = Vo;
function Do(e) {
  return jo(e);
}
function jo(e, t) {
  const s = os();
  s.__VUE__ = !0;
  const {
    insert: n,
    remove: r,
    patchProp: i,
    createElement: o,
    createText: l,
    createComment: c,
    setText: h,
    setElementText: a,
    parentNode: p,
    nextSibling: S,
    setScopeId: E = Ie,
    insertStaticContent: N
  } = e, T = (f, u, d, m = null, b = null, g = null, w = void 0, y = null, v = !!u.dynamicChildren) => {
    if (f === u)
      return;
    f && !xt(f, u) && (m = Bt(f), we(f, b, g, !0), f = null), u.patchFlag === -2 && (v = !1, u.dynamicChildren = null);
    const { type: _, ref: R, shapeFlag: x } = u;
    switch (_) {
      case us:
        Y(f, u, d, m);
        break;
      case Ge:
        q(f, u, d, m);
        break;
      case xs:
        f == null && L(u, d, m, w);
        break;
      case He:
        it(
          f,
          u,
          d,
          m,
          b,
          g,
          w,
          y,
          v
        );
        break;
      default:
        x & 1 ? z(
          f,
          u,
          d,
          m,
          b,
          g,
          w,
          y,
          v
        ) : x & 6 ? ze(
          f,
          u,
          d,
          m,
          b,
          g,
          w,
          y,
          v
        ) : (x & 64 || x & 128) && _.process(
          f,
          u,
          d,
          m,
          b,
          g,
          w,
          y,
          v,
          mt
        );
    }
    R != null && b ? Rt(R, f && f.ref, g, u || f, !u) : R == null && f && f.ref != null && Rt(f.ref, null, g, f, !0);
  }, Y = (f, u, d, m) => {
    if (f == null)
      n(
        u.el = l(u.children),
        d,
        m
      );
    else {
      const b = u.el = f.el;
      u.children !== f.children && h(b, u.children);
    }
  }, q = (f, u, d, m) => {
    f == null ? n(
      u.el = c(u.children || ""),
      d,
      m
    ) : u.el = f.el;
  }, L = (f, u, d, m) => {
    [f.el, f.anchor] = N(
      f.children,
      u,
      d,
      m,
      f.el,
      f.anchor
    );
  }, W = ({ el: f, anchor: u }, d, m) => {
    let b;
    for (; f && f !== u; )
      b = S(f), n(f, d, m), f = b;
    n(u, d, m);
  }, O = ({ el: f, anchor: u }) => {
    let d;
    for (; f && f !== u; )
      d = S(f), r(f), f = d;
    r(u);
  }, z = (f, u, d, m, b, g, w, y, v) => {
    if (u.type === "svg" ? w = "svg" : u.type === "math" && (w = "mathml"), f == null)
      fe(
        u,
        d,
        m,
        b,
        g,
        w,
        y,
        v
      );
    else {
      const _ = f.el && f.el._isVueCE ? f.el : null;
      try {
        _ && _._beginPatch(), Le(
          f,
          u,
          b,
          g,
          w,
          y,
          v
        );
      } finally {
        _ && _._endPatch();
      }
    }
  }, fe = (f, u, d, m, b, g, w, y) => {
    let v, _;
    const { props: R, shapeFlag: x, transition: C, dirs: P } = f;
    if (v = f.el = o(
      f.type,
      g,
      R && R.is,
      R
    ), x & 8 ? a(v, f.children) : x & 16 && ue(
      f.children,
      v,
      null,
      m,
      b,
      ws(f, g),
      w,
      y
    ), P && et(f, null, m, "created"), de(v, f, f.scopeId, w, m), R) {
      for (const B in R)
        B !== "value" && !Ct(B) && i(v, B, null, R[B], g, m);
      "value" in R && i(v, "value", null, R.value, g), (_ = R.onVnodeBeforeMount) && Ce(_, m, f);
    }
    P && et(f, null, m, "beforeMount");
    const j = Ho(b, C);
    j && C.beforeEnter(v), n(v, u, d), ((_ = R && R.onVnodeMounted) || j || P) && oe(() => {
      try {
        _ && Ce(_, m, f), j && C.enter(v), P && et(f, null, m, "mounted");
      } finally {
      }
    }, b);
  }, de = (f, u, d, m, b) => {
    if (d && E(f, d), m)
      for (let g = 0; g < m.length; g++)
        E(f, m[g]);
    if (b) {
      let g = b.subTree;
      if (u === g || qr(g.type) && (g.ssContent === u || g.ssFallback === u)) {
        const w = b.vnode;
        de(
          f,
          w,
          w.scopeId,
          w.slotScopeIds,
          b.parent
        );
      }
    }
  }, ue = (f, u, d, m, b, g, w, y, v = 0) => {
    for (let _ = v; _ < f.length; _++) {
      const R = f[_] = y ? $e(f[_]) : Oe(f[_]);
      T(
        null,
        R,
        u,
        d,
        m,
        b,
        g,
        w,
        y
      );
    }
  }, Le = (f, u, d, m, b, g, w) => {
    const y = u.el = f.el;
    let { patchFlag: v, dynamicChildren: _, dirs: R } = u;
    v |= f.patchFlag & 16;
    const x = f.props || J, C = u.props || J;
    let P;
    if (d && tt(d, !1), (P = C.onVnodeBeforeUpdate) && Ce(P, d, u, f), R && et(u, f, d, "beforeUpdate"), d && tt(d, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    _ && (!f.dynamicChildren || f.dynamicChildren.length !== _.length) && (v = 0, w = !1, _ = null), (x.innerHTML && C.innerHTML == null || x.textContent && C.textContent == null) && a(y, ""), _ ? ve(
      f.dynamicChildren,
      _,
      y,
      d,
      m,
      ws(u, b),
      g
    ) : w || D(
      f,
      u,
      y,
      null,
      d,
      m,
      ws(u, b),
      g,
      !1
    ), v > 0) {
      if (v & 16)
        ge(y, x, C, d, b);
      else if (v & 2 && x.class !== C.class && i(y, "class", null, C.class, b), v & 4 && i(y, "style", x.style, C.style, b), v & 8) {
        const j = u.dynamicProps;
        for (let B = 0; B < j.length; B++) {
          const U = j[B], X = x[U], Z = C[U];
          (Z !== X || U === "value") && i(y, U, X, Z, b, d);
        }
      }
      v & 1 && f.children !== u.children && a(y, u.children);
    } else !w && _ == null && ge(y, x, C, d, b);
    ((P = C.onVnodeUpdated) || R) && oe(() => {
      P && Ce(P, d, u, f), R && et(u, f, d, "updated");
    }, m);
  }, ve = (f, u, d, m, b, g, w) => {
    for (let y = 0; y < u.length; y++) {
      const v = f[y], _ = u[y], R = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        v.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (v.type === He || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !xt(v, _) || // - In the case of a component, it could contain anything.
        v.shapeFlag & 198) ? p(v.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          d
        )
      );
      T(
        v,
        _,
        R,
        null,
        m,
        b,
        g,
        w,
        !0
      );
    }
  }, ge = (f, u, d, m, b) => {
    if (u !== d) {
      if (u !== J)
        for (const g in u)
          !Ct(g) && !(g in d) && i(
            f,
            g,
            u[g],
            null,
            b,
            m
          );
      for (const g in d) {
        if (Ct(g)) continue;
        const w = d[g], y = u[g];
        w !== y && g !== "value" && i(f, g, y, w, b, m);
      }
      "value" in d && i(f, "value", u.value, d.value, b);
    }
  }, it = (f, u, d, m, b, g, w, y, v) => {
    const _ = u.el = f ? f.el : l(""), R = u.anchor = f ? f.anchor : l("");
    let { patchFlag: x, dynamicChildren: C, slotScopeIds: P } = u;
    P && (y = y ? y.concat(P) : P), f == null ? (n(_, d, m), n(R, d, m), ue(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      u.children || [],
      d,
      R,
      b,
      g,
      w,
      y,
      v
    )) : x > 0 && x & 64 && C && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    f.dynamicChildren && f.dynamicChildren.length === C.length ? (ve(
      f.dynamicChildren,
      C,
      d,
      b,
      g,
      w,
      y
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (u.key != null || b && u === b.subTree) && Br(
      f,
      u,
      !0
      /* shallow */
    )) : D(
      f,
      u,
      d,
      R,
      b,
      g,
      w,
      y,
      v
    );
  }, ze = (f, u, d, m, b, g, w, y, v) => {
    u.slotScopeIds = y, f == null ? u.shapeFlag & 512 ? b.ctx.activate(
      u,
      d,
      m,
      w,
      v
    ) : Qe(
      u,
      d,
      m,
      b,
      g,
      w,
      v
    ) : Xe(f, u, v);
  }, Qe = (f, u, d, m, b, g, w) => {
    const y = f.component = ko(
      f,
      m,
      b
    );
    if (Cr(f) && (y.ctx.renderer = mt), Go(y, !1, w), y.asyncDep) {
      if (b && b.registerDep(y, F, w), !f.el) {
        const v = y.subTree = Fe(Ge);
        q(null, v, u, d), f.placeholder = v.el;
      }
    } else
      F(
        y,
        f,
        u,
        d,
        b,
        g,
        w
      );
  }, Xe = (f, u, d) => {
    const m = u.component = f.component;
    if (Ro(f, u, d))
      if (m.asyncDep && !m.asyncResolved) {
        A(m, u, d);
        return;
      } else
        m.next = u, m.update();
    else
      u.el = f.el, m.vnode = u;
  }, F = (f, u, d, m, b, g, w) => {
    const y = () => {
      if (f.isMounted) {
        let { next: x, bu: C, u: P, parent: j, vnode: B } = f;
        {
          const Se = Kr(f);
          if (Se) {
            x && (x.el = B.el, A(f, x, w)), Se.asyncDep.then(() => {
              oe(() => {
                f.isUnmounted || _();
              }, b);
            });
            return;
          }
        }
        let U = x, X;
        tt(f, !1), x ? (x.el = B.el, A(f, x, w)) : x = B, C && ds(C), (X = x.props && x.props.onVnodeBeforeUpdate) && Ce(X, j, x, B), tt(f, !0);
        const Z = wn(f), xe = f.subTree;
        f.subTree = Z, T(
          xe,
          Z,
          // parent may have changed if it's in a teleport
          p(xe.el),
          // anchor may have changed if it's in a fragment
          Bt(xe),
          f,
          b,
          g
        ), x.el = Z.el, U === null && Oo(f, Z.el), P && oe(P, b), (X = x.props && x.props.onVnodeUpdated) && oe(
          () => Ce(X, j, x, B),
          b
        );
      } else {
        let x;
        const { el: C, props: P } = u, { bm: j, m: B, parent: U, root: X, type: Z } = f, xe = Ot(u);
        tt(f, !1), j && ds(j), !xe && (x = P && P.onVnodeBeforeMount) && Ce(x, U, u), tt(f, !0);
        {
          X.ce && X.ce._hasShadowRoot() && X.ce._injectChildStyle(
            Z,
            f.parent ? f.parent.type : void 0
          );
          const Se = f.subTree = wn(f);
          T(
            null,
            Se,
            d,
            m,
            f,
            b,
            g
          ), u.el = Se.el;
        }
        if (B && oe(B, b), !xe && (x = P && P.onVnodeMounted)) {
          const Se = u;
          oe(
            () => Ce(x, U, Se),
            b
          );
        }
        (u.shapeFlag & 256 || U && Ot(U.vnode) && U.vnode.shapeFlag & 256) && f.a && oe(f.a, b), f.isMounted = !0, u = d = m = null;
      }
    };
    f.scope.on();
    const v = f.effect = new Zn(y);
    f.scope.off();
    const _ = f.update = v.run.bind(v), R = f.job = v.runIfDirty.bind(v);
    R.i = f, R.id = f.uid, v.scheduler = () => zs(R), tt(f, !0), _();
  }, A = (f, u, d) => {
    u.component = f;
    const m = f.vnode.props;
    f.vnode = u, f.next = null, Mo(f, u.props, m, d), Lo(f, u.children, d), Ue(), pn(f), We();
  }, D = (f, u, d, m, b, g, w, y, v = !1) => {
    const _ = f && f.children, R = f ? f.shapeFlag : 0, x = u.children, { patchFlag: C, shapeFlag: P } = u;
    if (C > 0) {
      if (C & 128) {
        Wt(
          _,
          x,
          d,
          m,
          b,
          g,
          w,
          y,
          v
        );
        return;
      } else if (C & 256) {
        ye(
          _,
          x,
          d,
          m,
          b,
          g,
          w,
          y,
          v
        );
        return;
      }
    }
    P & 8 ? (R & 16 && bt(_, b, g), x !== _ && a(d, x)) : R & 16 ? P & 16 ? Wt(
      _,
      x,
      d,
      m,
      b,
      g,
      w,
      y,
      v
    ) : bt(_, b, g, !0) : (R & 8 && a(d, ""), P & 16 && ue(
      x,
      d,
      m,
      b,
      g,
      w,
      y,
      v
    ));
  }, ye = (f, u, d, m, b, g, w, y, v) => {
    f = f || ut, u = u || ut;
    const _ = f.length, R = u.length, x = Math.min(_, R);
    let C;
    for (C = 0; C < x; C++) {
      const P = u[C] = v ? $e(u[C]) : Oe(u[C]);
      T(
        f[C],
        P,
        d,
        null,
        b,
        g,
        w,
        y,
        v
      );
    }
    _ > R ? bt(
      f,
      b,
      g,
      !0,
      !1,
      x
    ) : ue(
      u,
      d,
      m,
      b,
      g,
      w,
      y,
      v,
      x
    );
  }, Wt = (f, u, d, m, b, g, w, y, v) => {
    let _ = 0;
    const R = u.length;
    let x = f.length - 1, C = R - 1;
    for (; _ <= x && _ <= C; ) {
      const P = f[_], j = u[_] = v ? $e(u[_]) : Oe(u[_]);
      if (xt(P, j))
        T(
          P,
          j,
          d,
          null,
          b,
          g,
          w,
          y,
          v
        );
      else
        break;
      _++;
    }
    for (; _ <= x && _ <= C; ) {
      const P = f[x], j = u[C] = v ? $e(u[C]) : Oe(u[C]);
      if (xt(P, j))
        T(
          P,
          j,
          d,
          null,
          b,
          g,
          w,
          y,
          v
        );
      else
        break;
      x--, C--;
    }
    if (_ > x) {
      if (_ <= C) {
        const P = C + 1, j = P < R ? u[P].el : m;
        for (; _ <= C; )
          T(
            null,
            u[_] = v ? $e(u[_]) : Oe(u[_]),
            d,
            j,
            b,
            g,
            w,
            y,
            v
          ), _++;
      }
    } else if (_ > C)
      for (; _ <= x; )
        we(f[_], b, g, !0), _++;
    else {
      const P = _, j = _, B = /* @__PURE__ */ new Map();
      for (_ = j; _ <= C; _++) {
        const ae = u[_] = v ? $e(u[_]) : Oe(u[_]);
        ae.key != null && B.set(ae.key, _);
      }
      let U, X = 0;
      const Z = C - j + 1;
      let xe = !1, Se = 0;
      const vt = new Array(Z);
      for (_ = 0; _ < Z; _++) vt[_] = 0;
      for (_ = P; _ <= x; _++) {
        const ae = f[_];
        if (X >= Z) {
          we(ae, b, g, !0);
          continue;
        }
        let Ee;
        if (ae.key != null)
          Ee = B.get(ae.key);
        else
          for (U = j; U <= C; U++)
            if (vt[U - j] === 0 && xt(ae, u[U])) {
              Ee = U;
              break;
            }
        Ee === void 0 ? we(ae, b, g, !0) : (vt[Ee - j] = _ + 1, Ee >= Se ? Se = Ee : xe = !0, T(
          ae,
          u[Ee],
          d,
          null,
          b,
          g,
          w,
          y,
          v
        ), X++);
      }
      const on = xe ? $o(vt) : ut;
      for (U = on.length - 1, _ = Z - 1; _ >= 0; _--) {
        const ae = j + _, Ee = u[ae], ln = u[ae + 1], cn = ae + 1 < R ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          ln.el || Yr(ln)
        ) : m;
        vt[_] === 0 ? T(
          null,
          Ee,
          d,
          cn,
          b,
          g,
          w,
          y,
          v
        ) : xe && (U < 0 || _ !== on[U] ? Ze(Ee, d, cn, 2) : U--);
      }
    }
  }, Ze = (f, u, d, m, b = null) => {
    const { el: g, type: w, transition: y, children: v, shapeFlag: _ } = f;
    if (_ & 6) {
      Ze(f.component.subTree, u, d, m);
      return;
    }
    if (_ & 128) {
      f.suspense.move(u, d, m);
      return;
    }
    if (_ & 64) {
      w.move(f, u, d, mt);
      return;
    }
    if (w === He) {
      n(g, u, d);
      for (let x = 0; x < v.length; x++)
        Ze(v[x], u, d, m);
      n(f.anchor, u, d);
      return;
    }
    if (w === xs) {
      W(f, u, d);
      return;
    }
    if (m !== 2 && _ & 1 && y)
      if (m === 0)
        y.persisted && !g[vs] ? n(g, u, d) : (y.beforeEnter(g), n(g, u, d), oe(() => y.enter(g), b));
      else {
        const { leave: x, delayLeave: C, afterLeave: P } = y, j = () => {
          f.ctx.isUnmounted ? r(g) : n(g, u, d);
        }, B = () => {
          const U = g._isLeaving || !!g[vs];
          g._isLeaving && g[vs](
            !0
            /* cancelled */
          ), y.persisted && !U ? j() : x(g, () => {
            j(), P && P();
          });
        };
        C ? C(g, j, B) : B();
      }
    else
      n(g, u, d);
  }, we = (f, u, d, m = !1, b = !1) => {
    const {
      type: g,
      props: w,
      ref: y,
      children: v,
      dynamicChildren: _,
      shapeFlag: R,
      patchFlag: x,
      dirs: C,
      cacheIndex: P,
      memo: j
    } = f;
    if (x === -2 && (b = !1), y != null && (Ue(), Rt(y, null, d, f, !0), We()), P != null && (u.renderCache[P] = void 0), R & 256) {
      u.ctx.deactivate(f);
      return;
    }
    const B = R & 1 && C, U = !Ot(f);
    let X;
    if (U && (X = w && w.onVnodeBeforeUnmount) && Ce(X, u, f), R & 6)
      oi(f.component, d, m);
    else {
      if (R & 128) {
        f.suspense.unmount(d, m);
        return;
      }
      B && et(f, null, u, "beforeUnmount"), R & 64 ? f.type.remove(
        f,
        u,
        d,
        mt,
        m
      ) : _ && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !_.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (g !== He || x > 0 && x & 64) ? bt(
        _,
        u,
        d,
        !1,
        !0
      ) : (g === He && x & 384 || !b && R & 16) && bt(v, u, d), m && nn(f);
    }
    const Z = j != null && P == null;
    (U && (X = w && w.onVnodeUnmounted) || B || Z) && oe(() => {
      X && Ce(X, u, f), B && et(f, null, u, "unmounted"), Z && (f.el = null);
    }, d);
  }, nn = (f) => {
    const { type: u, el: d, anchor: m, transition: b } = f;
    if (u === He) {
      ii(d, m);
      return;
    }
    if (u === xs) {
      O(f);
      return;
    }
    const g = () => {
      r(d), b && !b.persisted && b.afterLeave && b.afterLeave();
    };
    if (f.shapeFlag & 1 && b && !b.persisted) {
      const { leave: w, delayLeave: y } = b, v = () => w(d, g);
      y ? y(f.el, g, v) : v();
    } else
      g();
  }, ii = (f, u) => {
    let d;
    for (; f !== u; )
      d = S(f), r(f), f = d;
    r(u);
  }, oi = (f, u, d) => {
    const { bum: m, scope: b, job: g, subTree: w, um: y, m: v, a: _ } = f;
    En(v), En(_), m && ds(m), b.stop(), g && (g.flags |= 8, we(w, f, u, d)), y && oe(y, u), oe(() => {
      f.isUnmounted = !0;
    }, u);
  }, bt = (f, u, d, m = !1, b = !1, g = 0) => {
    for (let w = g; w < f.length; w++)
      we(f[w], u, d, m, b);
  }, Bt = (f) => {
    if (f.shapeFlag & 6)
      return Bt(f.component.subTree);
    if (f.shapeFlag & 128)
      return f.suspense.next();
    const u = S(f.anchor || f.el), d = u && u[to];
    return d ? S(d) : u;
  };
  let as = !1;
  const rn = (f, u, d) => {
    let m;
    f == null ? u._vnode && (we(u._vnode, null, null, !0), m = u._vnode.component) : T(
      u._vnode || null,
      f,
      u,
      null,
      null,
      null,
      d
    ), u._vnode = f, as || (as = !0, pn(m), mr(), as = !1);
  }, mt = {
    p: T,
    um: we,
    m: Ze,
    r: nn,
    mt: Qe,
    mc: ue,
    pc: D,
    pbc: ve,
    n: Bt,
    o: e
  };
  return {
    render: rn,
    hydrate: void 0,
    createApp: xo(rn)
  };
}
function ws({ type: e, props: t }, s) {
  return s === "svg" && e === "foreignObject" || s === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : s;
}
function tt({ effect: e, job: t }, s) {
  s ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Ho(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Br(e, t, s = !1) {
  const n = e.children, r = t.children;
  if (M(n) && M(r))
    for (let i = 0; i < n.length; i++) {
      const o = n[i];
      let l = r[i];
      l.shapeFlag & 1 && !l.dynamicChildren && ((l.patchFlag <= 0 || l.patchFlag === 32) && (l = r[i] = $e(r[i]), l.el = o.el), !s && l.patchFlag !== -2 && Br(o, l)), l.type === us && (l.patchFlag === -1 && (l = r[i] = $e(l)), l.el = o.el), l.type === Ge && !l.el && (l.el = o.el);
    }
}
function $o(e) {
  const t = e.slice(), s = [0];
  let n, r, i, o, l;
  const c = e.length;
  for (n = 0; n < c; n++) {
    const h = e[n];
    if (h !== 0) {
      if (r = s[s.length - 1], e[r] < h) {
        t[n] = r, s.push(n);
        continue;
      }
      for (i = 0, o = s.length - 1; i < o; )
        l = i + o >> 1, e[s[l]] < h ? i = l + 1 : o = l;
      h < e[s[i]] && (i > 0 && (t[n] = s[i - 1]), s[i] = n);
    }
  }
  for (i = s.length, o = s[i - 1]; i-- > 0; )
    s[i] = o, o = t[o];
  return s;
}
function Kr(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Kr(t);
}
function En(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Yr(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Yr(t.subTree) : null;
}
const qr = (e) => e.__isSuspense;
function Vo(e, t) {
  t && t.pendingBranch ? M(e) ? t.effects.push(...e) : t.effects.push(e) : Gi(e);
}
const He = /* @__PURE__ */ Symbol.for("v-fgt"), us = /* @__PURE__ */ Symbol.for("v-txt"), Ge = /* @__PURE__ */ Symbol.for("v-cmt"), xs = /* @__PURE__ */ Symbol.for("v-stc"), rt = [];
let he = null;
function ft(e = !1) {
  rt.push(he = e ? null : []);
}
function kr() {
  rt.pop(), he = rt[rt.length - 1] || null;
}
let jt = 1;
function Cn(e, t = !1) {
  jt += e, e < 0 && he && t && (he.hasOnce = !0);
}
function Jr(e) {
  return e.dynamicChildren = jt > 0 ? he || ut : null, kr(), jt > 0 && he && he.push(e), e;
}
function wt(e, t, s, n, r, i) {
  return Jr(
    V(
      e,
      t,
      s,
      n,
      r,
      i,
      !0
    )
  );
}
function Uo(e, t, s, n, r) {
  return Jr(
    Fe(
      e,
      t,
      s,
      n,
      r,
      !0
    )
  );
}
function Gr(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function xt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const zr = ({ key: e }) => e ?? null, Jt = ({
  ref: e,
  ref_key: t,
  ref_for: s
}) => (typeof e == "number" && (e = "" + e), e != null ? G(e) || /* @__PURE__ */ se(e) || I(e) ? { i: Me, r: e, k: t, f: !!s } : e : null);
function V(e, t = null, s = null, n = 0, r = null, i = e === He ? 0 : 1, o = !1, l = !1) {
  const c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && zr(t),
    ref: t && Jt(t),
    scopeId: yr,
    slotScopeIds: null,
    children: s,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: i,
    patchFlag: n,
    dynamicProps: r,
    dynamicChildren: null,
    appContext: null,
    ctx: Me
  };
  return l ? (es(c, s), i & 128 && e.normalize(c)) : s && (c.shapeFlag |= G(s) ? 8 : 16), jt > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  he && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (c.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  c.patchFlag !== 32 && he.push(c), c;
}
const Fe = Wo;
function Wo(e, t = null, s = null, n = 0, r = null, i = !1) {
  if ((!e || e === po) && (e = Ge), Gr(e)) {
    const l = _t(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return s && es(l, s), jt > 0 && !i && he && (l.shapeFlag & 6 ? he[he.indexOf(e)] = l : he.push(l)), l.patchFlag = -2, l;
  }
  if (Zo(e) && (e = e.__vccOpts), t) {
    t = Bo(t);
    let { class: l, style: c } = t;
    l && !G(l) && (t.class = ht(l)), K(c) && (/* @__PURE__ */ Gs(c) && !M(c) && (c = Q({}, c)), t.style = $s(c));
  }
  const o = G(e) ? 1 : qr(e) ? 128 : so(e) ? 64 : K(e) ? 4 : I(e) ? 2 : 0;
  return V(
    e,
    t,
    s,
    n,
    r,
    o,
    i,
    !0
  );
}
function Bo(e) {
  return e ? /* @__PURE__ */ Gs(e) || jr(e) ? Q({}, e) : e : null;
}
function _t(e, t, s = !1, n = !1) {
  const { props: r, ref: i, patchFlag: o, children: l, transition: c } = e, h = t ? Ko(r || {}, t) : r, a = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: h,
    key: h && zr(h),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      s && i ? M(i) ? i.concat(Jt(t)) : [i, Jt(t)] : Jt(t)
    ) : i,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: l,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== He ? o === -1 ? 16 : o | 16 : o,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: c,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && _t(e.ssContent),
    ssFallback: e.ssFallback && _t(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return c && n && Qs(
    a,
    c.clone(a)
  ), a;
}
function Qr(e = " ", t = 0) {
  return Fe(us, null, e, t);
}
function Tn(e = "", t = !1) {
  return t ? (ft(), Uo(Ge, null, e)) : Fe(Ge, null, e);
}
function Oe(e) {
  return e == null || typeof e == "boolean" ? Fe(Ge) : M(e) ? Fe(
    He,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Gr(e) ? $e(e) : Fe(us, null, String(e));
}
function $e(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : _t(e);
}
function es(e, t) {
  let s = 0;
  const { shapeFlag: n } = e;
  if (t == null)
    t = null;
  else if (M(t))
    s = 16;
  else if (typeof t == "object")
    if (n & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), es(e, r()), r._c && (r._d = !0));
      return;
    } else {
      s = 32;
      const r = t._;
      !r && !jr(t) ? t._ctx = Me : r === 3 && Me && (Me.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (I(t)) {
    if (n & 65) {
      es(e, { default: t });
      return;
    }
    t = { default: t, _ctx: Me }, s = 32;
  } else
    t = String(t), n & 64 ? (s = 16, t = [Qr(t)]) : s = 8;
  e.children = t, e.shapeFlag |= s;
}
function Ko(...e) {
  const t = {};
  for (let s = 0; s < e.length; s++) {
    const n = e[s];
    for (const r in n)
      if (r === "class")
        t.class !== n.class && (t.class = ht([t.class, n.class]));
      else if (r === "style")
        t.style = $s([t.style, n.style]);
      else if (ss(r)) {
        const i = t[r], o = n[r];
        o && i !== o && !(M(i) && i.includes(o)) ? t[r] = i ? [].concat(i, o) : o : o == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !ns(r) && (t[r] = o);
      } else r !== "" && (t[r] = n[r]);
  }
  return t;
}
function Ce(e, t, s, n = null) {
  me(e, t, 7, [
    s,
    n
  ]);
}
const Yo = Ir();
let qo = 0;
function ko(e, t, s) {
  const n = e.type, r = (t ? t.appContext : e.appContext) || Yo, i = {
    uid: qo++,
    vnode: e,
    type: n,
    parent: t,
    appContext: r,
    root: null,
    // to be immediately set
    next: null,
    subTree: null,
    // will be set synchronously right after creation
    effect: null,
    update: null,
    // will be set synchronously right after creation
    job: null,
    scope: new vi(
      !0
      /* detached */
    ),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: t ? t.provides : Object.create(r.provides),
    ids: t ? t.ids : ["", 0, 0],
    accessCache: null,
    renderCache: [],
    // local resolved assets
    components: null,
    directives: null,
    // resolved props and emits options
    propsOptions: $r(n, r),
    emitsOptions: Fr(n, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: J,
    // inheritAttrs
    inheritAttrs: n.inheritAttrs,
    // state
    ctx: J,
    data: J,
    props: J,
    attrs: J,
    slots: J,
    refs: J,
    setupState: J,
    setupContext: null,
    // suspense related
    suspense: s,
    suspenseId: s ? s.pendingId : 0,
    asyncDep: null,
    asyncResolved: !1,
    // lifecycle hooks
    // not using enums here because it results in computed properties
    isMounted: !1,
    isUnmounted: !1,
    isDeactivated: !1,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = Eo.bind(null, i), e.ce && e.ce(i), i;
}
let ie = null;
const Jo = () => ie || Me;
let ts, Ns;
{
  const e = os(), t = (s, n) => {
    let r;
    return (r = e[s]) || (r = e[s] = []), r.push(n), (i) => {
      r.length > 1 ? r.forEach((o) => o(i)) : r[0](i);
    };
  };
  ts = t(
    "__VUE_INSTANCE_SETTERS__",
    (s) => ie = s
  ), Ns = t(
    "__VUE_SSR_SETTERS__",
    (s) => Ht = s
  );
}
const Ut = (e) => {
  const t = ie;
  return ts(e), e.scope.on(), () => {
    e.scope.off(), ts(t);
  };
}, An = () => {
  ie && ie.scope.off(), ts(null);
};
function Xr(e) {
  return e.vnode.shapeFlag & 4;
}
let Ht = !1;
function Go(e, t = !1, s = !1) {
  t && Ns(t);
  const { props: n, children: r } = e.vnode, i = Xr(e);
  Po(e, n, i, t), No(e, r, s || t);
  const o = i ? zo(e, t) : void 0;
  return t && Ns(!1), o;
}
function zo(e, t) {
  const s = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, go);
  const { setup: n } = s;
  if (n) {
    Ue();
    const r = e.setupContext = n.length > 1 ? Xo(e) : null, i = Ut(e), o = Vt(
      n,
      e,
      0,
      [
        e.props,
        r
      ]
    ), l = qn(o);
    if (We(), i(), (l || e.sp) && !Ot(e) && Er(e), l) {
      if (o.then(An, An), t)
        return o.then((c) => {
          Rn(e, c);
        }).catch((c) => {
          ls(c, e, 0);
        });
      e.asyncDep = o;
    } else
      Rn(e, o);
  } else
    Zr(e);
}
function Rn(e, t, s) {
  I(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : K(t) && (e.setupState = pr(t)), Zr(e);
}
function Zr(e, t, s) {
  const n = e.type;
  e.render || (e.render = n.render || Ie);
  {
    const r = Ut(e);
    Ue();
    try {
      _o(e);
    } finally {
      We(), r();
    }
  }
}
const Qo = {
  get(e, t) {
    return te(e, "get", ""), e[t];
  }
};
function Xo(e) {
  const t = (s) => {
    e.exposed = s || {};
  };
  return {
    attrs: new Proxy(e.attrs, Qo),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function en(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(pr($i(e.exposed)), {
    get(t, s) {
      if (s in t)
        return t[s];
      if (s in Pt)
        return Pt[s](e);
    },
    has(t, s) {
      return s in t || s in Pt;
    }
  })) : e.proxy;
}
function Zo(e) {
  return I(e) && "__vccOpts" in e;
}
const Ye = (e, t) => /* @__PURE__ */ Ki(e, t, Ht), el = "3.5.40";
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Ls;
const On = typeof window < "u" && window.trustedTypes;
if (On)
  try {
    Ls = /* @__PURE__ */ On.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const ei = Ls ? (e) => Ls.createHTML(e) : (e) => e, tl = "http://www.w3.org/2000/svg", sl = "http://www.w3.org/1998/Math/MathML", je = typeof document < "u" ? document : null, Pn = je && /* @__PURE__ */ je.createElement("template"), nl = {
  insert: (e, t, s) => {
    t.insertBefore(e, s || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, s, n) => {
    const r = t === "svg" ? je.createElementNS(tl, e) : t === "mathml" ? je.createElementNS(sl, e) : s ? je.createElement(e, { is: s }) : je.createElement(e);
    return e === "select" && n && n.multiple != null && r.setAttribute("multiple", n.multiple), r;
  },
  createText: (e) => je.createTextNode(e),
  createComment: (e) => je.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => je.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, s, n, r, i) {
    const o = s ? s.previousSibling : t.lastChild;
    if (r && (r === i || r.nextSibling))
      for (; t.insertBefore(r.cloneNode(!0), s), !(r === i || !(r = r.nextSibling)); )
        ;
    else {
      Pn.innerHTML = ei(
        n === "svg" ? `<svg>${e}</svg>` : n === "mathml" ? `<math>${e}</math>` : e
      );
      const l = Pn.content;
      if (n === "svg" || n === "mathml") {
        const c = l.firstChild;
        for (; c.firstChild; )
          l.appendChild(c.firstChild);
        l.removeChild(c);
      }
      t.insertBefore(l, s);
    }
    return [
      // first
      o ? o.nextSibling : t.firstChild,
      // last
      s ? s.previousSibling : t.lastChild
    ];
  }
}, rl = /* @__PURE__ */ Symbol("_vtc");
function il(e, t, s) {
  const n = e[rl];
  n && (t = (t ? [t, ...n] : [...n]).join(" ")), t == null ? e.removeAttribute("class") : s ? e.setAttribute("class", t) : e.className = t;
}
const Mn = /* @__PURE__ */ Symbol("_vod"), ol = /* @__PURE__ */ Symbol("_vsh"), ll = /* @__PURE__ */ Symbol(""), cl = /(?:^|;)\s*display\s*:/;
function fl(e, t, s) {
  const n = e.style, r = G(s);
  let i = !1;
  if (s && !r) {
    if (t)
      if (G(t))
        for (const o of t.split(";")) {
          const l = o.slice(0, o.indexOf(":")).trim();
          s[l] == null && Et(n, l, "");
        }
      else
        for (const o in t)
          s[o] == null && Et(n, o, "");
    for (const o in s) {
      o === "display" && (i = !0);
      const l = s[o];
      l != null ? al(
        e,
        o,
        !G(t) && t ? t[o] : void 0,
        l
      ) || Et(n, o, l) : Et(n, o, "");
    }
  } else if (r) {
    if (t !== s) {
      const o = n[ll];
      o && (s += ";" + o), n.cssText = s, i = cl.test(s);
    }
  } else t && e.removeAttribute("style");
  Mn in e && (e[Mn] = i ? n.display : "", e[ol] && (n.display = "none"));
}
const In = /\s*!important$/;
function Et(e, t, s) {
  if (M(s))
    s.forEach((n) => Et(e, t, n));
  else if (s == null && (s = ""), t.startsWith("--"))
    e.setProperty(t, s);
  else {
    const n = ul(e, t);
    In.test(s) ? e.setProperty(
      pe(n),
      s.replace(In, ""),
      "important"
    ) : e[n] = s;
  }
}
const Fn = ["Webkit", "Moz", "ms"], Ss = {};
function ul(e, t) {
  const s = Ss[t];
  if (s)
    return s;
  let n = ce(t);
  if (n !== "filter" && n in e)
    return Ss[t] = n;
  n = Jn(n);
  for (let r = 0; r < Fn.length; r++) {
    const i = Fn[r] + n;
    if (i in e)
      return Ss[t] = i;
  }
  return t;
}
function al(e, t, s, n) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && G(n) && s === n;
}
const Nn = "http://www.w3.org/1999/xlink";
function Ln(e, t, s, n, r, i = bi(t)) {
  n && t.startsWith("xlink:") ? s == null ? e.removeAttributeNS(Nn, t.slice(6, t.length)) : e.setAttributeNS(Nn, t, s) : s == null || i && !zn(s) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Ne(s) ? String(s) : s
  );
}
function Dn(e, t, s, n, r) {
  if (t === "innerHTML" || t === "textContent") {
    s != null && (e[t] = t === "innerHTML" ? ei(s) : s);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const l = i === "OPTION" ? e.getAttribute("value") || "" : e.value, c = s == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(s);
    (l !== c || !("_value" in e)) && (e.value = c), s == null && e.removeAttribute(t), e._value = s;
    return;
  }
  let o = !1;
  if (s === "" || s == null) {
    const l = typeof e[t];
    l === "boolean" ? s = zn(s) : s == null && l === "string" ? (s = "", o = !0) : l === "number" && (s = 0, o = !0);
  }
  try {
    e[t] = s;
  } catch {
  }
  o && e.removeAttribute(r || t);
}
function hl(e, t, s, n) {
  e.addEventListener(t, s, n);
}
function dl(e, t, s, n) {
  e.removeEventListener(t, s, n);
}
const jn = /* @__PURE__ */ Symbol("_vei");
function pl(e, t, s, n, r = null) {
  const i = e[jn] || (e[jn] = {}), o = i[t];
  if (n && o)
    o.value = n;
  else {
    const [l, c] = bl(t);
    if (n) {
      const h = i[t] = yl(
        n,
        r
      );
      hl(e, l, h, c);
    } else o && (dl(e, l, o, c), i[t] = void 0);
  }
}
const gl = /(Once|Passive|Capture)$/, _l = /^on:?(?:Once|Passive|Capture)$/;
function bl(e) {
  let t, s;
  for (; (s = e.match(gl)) && !_l.test(e); )
    t || (t = {}), e = e.slice(0, e.length - s[1].length), t[s[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : pe(e.slice(2)), t];
}
let Es = 0;
const ml = /* @__PURE__ */ Promise.resolve(), vl = () => Es || (ml.then(() => Es = 0), Es = Date.now());
function yl(e, t) {
  const s = (n) => {
    if (!n._vts)
      n._vts = Date.now();
    else if (n._vts <= s.attached)
      return;
    const r = s.value;
    if (M(r)) {
      const i = n.stopImmediatePropagation;
      n.stopImmediatePropagation = () => {
        i.call(n), n._stopped = !0;
      };
      const o = r.slice(), l = [n];
      for (let c = 0; c < o.length && !n._stopped; c++) {
        const h = o[c];
        h && me(
          h,
          t,
          5,
          l
        );
      }
    } else
      me(
        r,
        t,
        5,
        [n]
      );
  };
  return s.value = e, s.attached = vl(), s;
}
const Hn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, wl = (e, t, s, n, r, i) => {
  const o = r === "svg";
  t === "class" ? il(e, n, o) : t === "style" ? fl(e, s, n) : ss(t) ? ns(t) || pl(e, t, s, n, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : xl(e, t, n, o)) ? (Dn(e, t, n), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Ln(e, t, n, o, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Sl(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !G(n))) ? Dn(e, ce(t), n, i, t) : (t === "true-value" ? e._trueValue = n : t === "false-value" && (e._falseValue = n), Ln(e, t, n, o));
};
function xl(e, t, s, n) {
  if (n)
    return !!(t === "innerHTML" || t === "textContent" || t in e && Hn(t) && I(s));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return Hn(t) && G(s) ? !1 : t in e;
}
function Sl(e, t) {
  const s = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!s)
    return !1;
  const n = ce(t);
  return Array.isArray(s) ? s.some((r) => ce(r) === n) : Object.keys(s).some((r) => ce(r) === n);
}
const $n = {};
// @__NO_SIDE_EFFECTS__
function El(e, t, s) {
  let n = /* @__PURE__ */ Sr(e, t);
  rs(n) && (n = Q({}, n, t));
  class r extends tn {
    constructor(o) {
      super(n, o, s);
    }
  }
  return r.def = n, r;
}
const Cl = typeof HTMLElement < "u" ? HTMLElement : class {
};
class tn extends Cl {
  constructor(t, s = {}, n = Un) {
    super(), this._def = t, this._props = s, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== Un ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
      Q({}, t.shadowRootOptions, {
        mode: "open"
      })
    ), this._root = this.shadowRoot) : this._root = this;
  }
  connectedCallback() {
    if (!this.isConnected) return;
    !this.shadowRoot && !this._resolved && this._parseSlots(), this._connected = !0;
    let t = this;
    for (; t = t && // #12479 should check assignedSlot first to get correct parent
    (t.assignedSlot || t.parentNode || t.host); )
      if (t instanceof tn) {
        this._parent = t;
        break;
      }
    this._instance || (this._resolved ? this._mount(this._def) : t && t._pendingResolve ? this._pendingResolve = t._pendingResolve.then(() => {
      this._pendingResolve = void 0, this._resolveDef();
    }) : this._resolveDef());
  }
  _setParent(t = this._parent) {
    t && (this._instance.parent = t._instance, this._inheritParentContext(t));
  }
  _inheritParentContext(t = this._parent) {
    t && this._app && Object.setPrototypeOf(
      this._app._context.provides,
      t._instance.provides
    );
  }
  disconnectedCallback() {
    this._connected = !1, _r(() => {
      this._connected || (this._ob && (this._ob.disconnect(), this._ob = null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets && (this._teleportTargets.clear(), this._teleportTargets = void 0));
    });
  }
  _processMutations(t) {
    for (const s of t)
      this._setAttr(s.attributeName);
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve)
      return;
    for (let n = 0; n < this.attributes.length; n++)
      this._setAttr(this.attributes[n].name);
    this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
    const t = (n, r = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: i, styles: o } = n;
      let l;
      if (i && !M(i))
        for (const c in i) {
          const h = i[c];
          (h === Number || h && h.type === Number) && (c in this._props && (this._props[c] = un(this._props[c])), (l || (l = /* @__PURE__ */ Object.create(null)))[ce(c)] = !0);
        }
      this._numberProps = l, this._resolveProps(n), this.shadowRoot && this._applyStyles(o), this._mount(n);
    }, s = this._def.__asyncLoader;
    s ? this._pendingResolve = s().then((n) => {
      n.configureApp = this._def.configureApp, t(this._def = n, !0);
    }) : t(this._def);
  }
  _mount(t) {
    this._app = this._createApp(t), this._inheritParentContext(), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const s = this._instance && this._instance.exposed;
    if (s)
      for (const n in s)
        H(this, n) || Object.defineProperty(this, n, {
          // unwrap ref to be consistent with public instance behavior
          get: () => dr(s[n])
        });
  }
  _resolveProps(t) {
    const { props: s } = t, n = M(s) ? s : Object.keys(s || {});
    for (const r of Object.keys(this))
      r[0] !== "_" && n.includes(r) && this._setProp(r, this[r]);
    for (const r of n.map(ce))
      Object.defineProperty(this, r, {
        get() {
          return this._getProp(r);
        },
        set(i) {
          this._setProp(r, i, !0, !this._patching);
        }
      });
  }
  _setAttr(t) {
    if (t.startsWith("data-v-")) return;
    const s = this.hasAttribute(t);
    let n = s ? this.getAttribute(t) : $n;
    const r = ce(t);
    s && this._numberProps && this._numberProps[r] && (n = un(n)), this._setProp(r, n, !1, !0);
  }
  /**
   * @internal
   */
  _getProp(t) {
    return this._props[t];
  }
  /**
   * @internal
   */
  _setProp(t, s, n = !0, r = !1) {
    if (s !== this._props[t] && (this._dirty = !0, s === $n ? delete this._props[t] : (this._props[t] = s, t === "key" && this._app && (this._app._ceVNode.key = s)), r && this._instance && this._update(), n)) {
      const i = this._ob;
      i && (this._processMutations(i.takeRecords()), i.disconnect()), s === !0 ? this.setAttribute(pe(t), "") : typeof s == "string" || typeof s == "number" ? this.setAttribute(pe(t), s + "") : s || this.removeAttribute(pe(t)), i && i.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), Al(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const s = Fe(this._def, Q(t, this._props));
    return this._instance || (s.ce = (n) => {
      this._instance = n, n.ce = this, n.isCE = !0;
      const r = (i, o) => {
        this.dispatchEvent(
          new CustomEvent(
            i,
            rs(o[0]) ? Q({ detail: o }, o[0]) : { detail: o }
          )
        );
      };
      n.emit = (i, ...o) => {
        r(i, o), pe(i) !== i && r(pe(i), o);
      }, this._setParent();
    }), s;
  }
  _applyStyles(t, s, n) {
    if (!t) return;
    if (s) {
      if (s === this._def || this._styleChildren.has(s))
        return;
      this._styleChildren.add(s);
    }
    const r = this._nonce, i = this.shadowRoot, o = n ? this._getStyleAnchor(n) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i);
    let l = null;
    for (let c = t.length - 1; c >= 0; c--) {
      const h = document.createElement("style");
      r && h.setAttribute("nonce", r), h.textContent = t[c], i.insertBefore(h, l || o), l = h, c === 0 && (n || this._styleAnchors.set(this._def, h), s && this._styleAnchors.set(s, h));
    }
  }
  _getStyleAnchor(t) {
    if (!t)
      return null;
    const s = this._styleAnchors.get(t);
    return s && s.parentNode === this.shadowRoot ? s : (s && this._styleAnchors.delete(t), null);
  }
  _getRootStyleInsertionAnchor(t) {
    for (let s = 0; s < t.childNodes.length; s++) {
      const n = t.childNodes[s];
      if (!(n instanceof HTMLStyleElement))
        return n;
    }
    return null;
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const t = this._slots = {};
    let s;
    for (; s = this.firstChild; ) {
      const n = s.nodeType === 1 && s.getAttribute("slot") || "default";
      (t[n] || (t[n] = [])).push(s), this.removeChild(s);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const t = this._getSlots(), s = this._instance.type.__scopeId;
    for (let n = 0; n < t.length; n++) {
      const r = t[n], i = r.getAttribute("name") || "default", o = this._slots[i], l = r.parentNode;
      if (o)
        for (const c of o) {
          if (s && c.nodeType === 1) {
            const h = s + "-s", a = document.createTreeWalker(c, 1);
            c.setAttribute(h, "");
            let p;
            for (; p = a.nextNode(); )
              p.setAttribute(h, "");
          }
          l.insertBefore(c, r);
        }
      else
        for (; r.firstChild; ) l.insertBefore(r.firstChild, r);
      l.removeChild(r);
    }
  }
  /**
   * @internal
   */
  _getSlots() {
    const t = [this];
    this._teleportTargets && t.push(...this._teleportTargets);
    const s = /* @__PURE__ */ new Set();
    for (const n of t) {
      const r = n.querySelectorAll("slot");
      for (let i = 0; i < r.length; i++)
        s.add(r[i]);
    }
    return Array.from(s);
  }
  /**
   * @internal
   */
  _injectChildStyle(t, s) {
    this._applyStyles(t.styles, t, s);
  }
  /**
   * @internal
   */
  _beginPatch() {
    this._patching = !0, this._dirty = !1;
  }
  /**
   * @internal
   */
  _endPatch() {
    this._patching = !1, this._dirty && this._instance && this._update();
  }
  /**
   * @internal
   */
  _hasShadowRoot() {
    return this._def.shadowRoot !== !1;
  }
  /**
   * @internal
   */
  _removeChildStyle(t) {
  }
}
const Tl = /* @__PURE__ */ Q({ patchProp: wl }, nl);
let Vn;
function ti() {
  return Vn || (Vn = Do(Tl));
}
const Al = ((...e) => {
  ti().render(...e);
}), Un = ((...e) => {
  const t = ti().createApp(...e), { mount: s } = t;
  return t.mount = (n) => {
    const r = Ol(n);
    if (!r) return;
    const i = t._component;
    !I(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const o = s(r, !1, Rl(r));
    return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), o;
  }, t;
});
function Rl(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function Ol(e) {
  return G(e) ? document.querySelector(e) : e;
}
const Pl = 8e3, Ml = 2e3, Wn = 1e6, le = "Unable to complete this request.", Bn = "Request timed out.", Mt = "Request cancelled.", si = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Il = `query YarrRuntime { yarrRuntime { ${si} } }`, Fl = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${si} }
}`;
function sn(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function It(e) {
  return new DOMException(e, "AbortError");
}
async function Nl(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw It(Mt);
    return;
  }
  await new Promise((t, s) => {
    const n = window.setInterval(() => {
      window.csrf_token && o(t);
    }, 20), r = window.setTimeout(() => o(t), Ml), i = () => o(() => s(It(Mt))), o = (l) => {
      window.clearInterval(n), window.clearTimeout(r), e.removeEventListener("abort", i), l();
    };
    e.addEventListener("abort", i, { once: !0 });
  });
}
async function Ll(e) {
  const t = e.body;
  if (!t) throw new Error(le);
  const s = e.headers.get("content-length");
  if (s && /^(?:0|[1-9]\d*)$/.test(s)) {
    const c = Number(s);
    if (Number.isSafeInteger(c) && c > Wn) {
      try {
        await t.cancel();
      } catch {
      }
      throw new Error(le);
    }
  }
  const n = t.getReader(), r = [];
  let i = 0;
  try {
    for (; ; ) {
      const { done: c, value: h } = await n.read();
      if (c) break;
      if (i += h.byteLength, i > Wn) {
        try {
          await n.cancel();
        } catch {
        }
        throw new Error(le);
      }
      r.push(h);
    }
  } catch (c) {
    throw c instanceof Error && c.message === le ? c : new Error(le);
  } finally {
    n.releaseLock();
  }
  const o = new Uint8Array(i);
  let l = 0;
  for (const c of r)
    o.set(c, l), l += c.byteLength;
  try {
    const c = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(o));
    if (!sn(c)) throw new Error(le);
    return c;
  } catch {
    throw new Error(le);
  }
}
async function Dl(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function ni(e, t, s) {
  const n = new AbortController();
  let r = !1, i = !1;
  const o = window.setTimeout(() => {
    r = !0, n.abort(It(Bn));
  }, Pl), l = () => n.abort(It(Mt));
  s != null && s.aborted ? l() : s == null || s.addEventListener("abort", l, { once: !0 });
  try {
    if (await Nl(n.signal), n.signal.aborted) throw It(Mt);
    const c = await fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": window.csrf_token ?? ""
      },
      body: JSON.stringify({ query: e, variables: t }),
      signal: n.signal
    });
    if (!c.ok)
      throw i = !0, await Dl(c.body), n.abort(), new Error(le);
    const h = await Ll(c);
    if (Array.isArray(h.errors) && h.errors.length > 0) throw new Error(le);
    if (!sn(h.data)) throw new Error(le);
    return h.data;
  } catch (c) {
    throw r ? new Error(Bn) : i ? new Error(le) : n.signal.aborted ? new Error(Mt) : c instanceof Error && c.message === le ? c : new Error(le);
  } finally {
    window.clearTimeout(o), s == null || s.removeEventListener("abort", l);
  }
}
function ri(e, t) {
  const s = e[t];
  if (!sn(s)) throw new Error(le);
  return s;
}
async function jl(e) {
  return ri(await ni(Il, void 0, e), "yarrRuntime");
}
async function Hl(e, t) {
  return ri(
    await ni(Fl, { action: e }, t),
    "controlYarr"
  );
}
const $l = ["aria-busy"], Vl = { class: "yarr-dashboard__header" }, Ul = { class: "yarr-dashboard__header-actions" }, Wl = {
  key: 0,
  class: "yarr-dashboard__notice is-error",
  role: "alert"
}, Bl = {
  key: 1,
  class: "yarr-dashboard__notice is-stale",
  role: "status"
}, Kl = {
  key: 2,
  class: "yarr-dashboard__notice",
  role: "status"
}, Yl = { class: "yarr-dashboard__footer" }, ql = { class: "yarr-dashboard__message" }, kl = { class: "yarr-dashboard__freshness" }, Jl = ["disabled"], Gl = 3e4, zl = 75e3, Ql = 5e3, Xl = "/plugins/yarr/yarr-2b068b08366b.png", Zl = /* @__PURE__ */ Sr({
  __name: "YarrDashboard.ce",
  setup(e) {
    const t = /* @__PURE__ */ lt(), s = /* @__PURE__ */ lt(), n = /* @__PURE__ */ lt(""), r = /* @__PURE__ */ lt(!1), i = /* @__PURE__ */ lt(), o = /* @__PURE__ */ lt(Date.now());
    let l = !1, c, h, a, p, S = !1, E = 0;
    const N = () => l && document.visibilityState !== "hidden", T = Ye(() => i.value !== void 0 && o.value - i.value > zl), Y = Ye(() => {
      var F, A;
      return n.value || T.value ? null : ((F = s.value) == null ? void 0 : F.state) === "running" ? "STOP" : ((A = s.value) == null ? void 0 : A.state) === "stopped" ? "START" : null;
    }), q = Ye(() => Y.value === "STOP" ? "Stop Yarr" : "Start Yarr"), L = Ye(() => n.value ? "Unavailable" : s.value ? T.value ? "Stale" : s.value.ready ? "Ready" : s.value.state === "running" ? "Attention" : s.value.state === "stopped" ? "Stopped" : "Changing" : "Loading"), W = Ye(() => n.value ? "error" : !s.value || s.value.state === "stopped" ? "neutral" : T.value || !s.value.ready ? "warning" : "success"), O = Ye(() => i.value === void 0 ? "Awaiting first confirmed status" : T.value ? "Last confirmed status is stale" : "Status confirmed recently"), z = Ye(() => s.value ? Y.value ? s.value.healthMessage : "State is changing or unavailable. Wait for the next refresh before acting." : "Waiting for a bounded GraphQL status response.");
    function fe() {
      c !== void 0 && window.clearTimeout(c), c = void 0;
    }
    function de() {
      h !== void 0 && window.clearInterval(h), h = void 0;
    }
    function ue() {
      h === void 0 && (o.value = Date.now(), h = window.setInterval(() => {
        o.value = Date.now();
      }, Ql));
    }
    function Le() {
      fe(), de(), E += 1, a == null || a.abort(), r.value = !1;
    }
    function ve() {
      fe(), N() && (c = window.setTimeout(() => {
        ge();
      }, Gl));
    }
    async function ge() {
      if (!N() || r.value) return;
      ue(), a = new AbortController();
      const F = ++E;
      r.value = !0;
      try {
        const A = await jl(a.signal);
        F === E && (s.value = A, i.value = Date.now(), o.value = i.value, n.value = "");
      } catch {
        F === E && !a.signal.aborted && (n.value = "Status unavailable. Open settings for recovery details.");
      } finally {
        F === E && (r.value = !1, ve());
      }
    }
    async function it() {
      if (!Y.value || r.value) return;
      a = new AbortController();
      const F = ++E;
      r.value = !0, n.value = "";
      try {
        const A = await Hl(Y.value, a.signal);
        F === E && (s.value = A, i.value = Date.now(), o.value = i.value);
      } catch {
        F === E && !a.signal.aborted && (n.value = "Control result was not confirmed. Refresh status before retrying.");
      } finally {
        F === E && (r.value = !1, ve());
      }
    }
    function ze() {
      S && (l = Qe()), N() ? (ue(), ge()) : Le();
    }
    function Qe() {
      if (!t.value || document.visibilityState === "hidden") return !1;
      const F = t.value.getBoundingClientRect(), A = window.innerWidth || document.documentElement.clientWidth, D = window.innerHeight || document.documentElement.clientHeight;
      return F.bottom > 0 && F.right > 0 && F.top < D && F.left < A;
    }
    function Xe() {
      const F = Qe();
      F !== l && (l = F, N() ? (ue(), ge()) : Le());
    }
    return Ar(() => {
      document.addEventListener("visibilitychange", ze), typeof IntersectionObserver == "function" ? (p = new IntersectionObserver((F) => {
        const A = F.some((D) => D.isIntersecting);
        A !== l && (l = A, N() ? (ue(), ge()) : Le());
      }), t.value && p.observe(t.value)) : (S = !0, window.addEventListener("scroll", Xe, { passive: !0 }), window.addEventListener("resize", Xe), l = Qe(), N() && ge());
    }), Rr(() => {
      l = !1, Le(), p == null || p.disconnect(), S && (window.removeEventListener("scroll", Xe), window.removeEventListener("resize", Xe)), document.removeEventListener("visibilitychange", ze);
    }), (F, A) => {
      var D, ye;
      return ft(), wt("section", {
        ref_key: "root",
        ref: t,
        class: ht(["yarr-dashboard", { "is-stale": T.value, "has-error": n.value }]),
        "aria-labelledby": "yarr-dashboard-title",
        "aria-busy": r.value
      }, [
        V("header", Vl, [
          V("div", { class: "yarr-dashboard__brand" }, [
            V("img", {
              src: Xl,
              alt: "",
              width: "42",
              height: "42"
            }),
            A[0] || (A[0] = V("div", null, [
              V("p", { class: "yarr-dashboard__eyebrow" }, "Media fleet control"),
              V("h2", { id: "yarr-dashboard-title" }, "Yarr")
            ], -1))
          ]),
          V("div", Ul, [
            V("span", {
              class: ht(["yarr-dashboard__status", `is-${W.value}`]),
              role: "status"
            }, [
              A[1] || (A[1] = V("span", {
                class: "yarr-dashboard__dot",
                "aria-hidden": "true"
              }, null, -1)),
              Qr(Te(L.value), 1)
            ], 2),
            A[2] || (A[2] = V("a", { href: "/Settings/Yarr" }, "Settings", -1))
          ])
        ]),
        n.value ? (ft(), wt("p", Wl, Te(n.value), 1)) : T.value ? (ft(), wt("p", Bl, "Status is stale. Open settings before taking action.")) : s.value ? Tn("", !0) : (ft(), wt("p", Kl, "Checking the local Yarr runtime...")),
        V("ol", {
          class: ht(["yarr-dashboard__signals", { "is-unconfirmed": !s.value || n.value || T.value }]),
          "aria-label": "Yarr runtime signals"
        }, [
          V("li", null, [
            A[3] || (A[3] = V("span", null, "Process", -1)),
            V("strong", null, Te(((D = s.value) == null ? void 0 : D.state) ?? "Checking"), 1)
          ]),
          V("li", null, [
            A[4] || (A[4] = V("span", null, "Health", -1)),
            V("strong", null, Te(s.value ? s.value.ready ? "Ready" : "Not ready" : "Checking"), 1)
          ]),
          V("li", null, [
            A[5] || (A[5] = V("span", null, "Listener", -1)),
            V("strong", null, Te(s.value ? `${s.value.bindAddress}:${s.value.port}` : "Checking"), 1)
          ]),
          V("li", null, [
            A[6] || (A[6] = V("span", null, "Version", -1)),
            V("strong", null, Te(((ye = s.value) == null ? void 0 : ye.version) ?? (s.value ? "Unavailable" : "Checking")), 1)
          ])
        ], 2),
        V("div", Yl, [
          V("div", null, [
            V("p", ql, Te(z.value), 1),
            V("p", kl, Te(O.value), 1)
          ]),
          Y.value ? (ft(), wt("button", {
            key: 0,
            type: "button",
            disabled: r.value,
            onClick: it
          }, Te(r.value ? "Working..." : q.value), 9, Jl)) : Tn("", !0)
        ])
      ], 10, $l);
    };
  }
}), ec = /* @__PURE__ */ El(Zl, { shadowRoot: !1 });
customElements.get("yarr-dashboard") || customElements.define("yarr-dashboard", ec);
