/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function ds(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const Z = {}, It = [], Ge = () => {
}, xr = () => !1, $n = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), In = (e) => e.startsWith("onUpdate:"), ie = Object.assign, hs = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Ui = Object.prototype.hasOwnProperty, W = (e, t) => Ui.call(e, t), Y = Array.isArray, Ot = (e) => an(e) === "[object Map]", Yt = (e) => an(e) === "[object Set]", Vs = (e) => an(e) === "[object Date]", H = (e) => typeof e == "function", re = (e) => typeof e == "string", De = (e) => typeof e == "symbol", Q = (e) => e !== null && typeof e == "object", Er = (e) => (Q(e) || H(e)) && H(e.then) && H(e.catch), Ar = Object.prototype.toString, an = (e) => Ar.call(e), Di = (e) => an(e).slice(8, -1), On = (e) => an(e) === "[object Object]", ps = (e) => re(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Gt = /* @__PURE__ */ ds(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Pn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Ni = /-\w/g, Ce = Pn(
  (e) => e.replace(Ni, (t) => t.slice(1).toUpperCase())
), Li = /\B([A-Z])/g, Ie = Pn(
  (e) => e.replace(Li, "-$1").toLowerCase()
), Rr = Pn((e) => e.charAt(0).toUpperCase() + e.slice(1)), Hn = Pn(
  (e) => e ? `on${Rr(e)}` : ""
), We = (e, t) => !Object.is(e, t), bn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Tr = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, kn = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Fs = (e) => {
  const t = re(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Bs;
const Mn = () => Bs || (Bs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : {});
function gs(e) {
  if (Y(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], r = re(s) ? Bi(s) : gs(s);
      if (r)
        for (const i in r)
          t[i] = r[i];
    }
    return t;
  } else if (re(e) || Q(e))
    return e;
}
const Yi = /;(?![^(]*\))/g, Vi = /:([^]+)/, Fi = /\/\*[^]*?\*\//g;
function Bi(e) {
  const t = {};
  return e.replace(Fi, "").split(Yi).forEach((n) => {
    if (n) {
      const s = n.split(Vi);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Et(e) {
  let t = "";
  if (re(e))
    t = e;
  else if (Y(e))
    for (let n = 0; n < e.length; n++) {
      const s = Et(e[n]);
      s && (t += s + " ");
    }
  else if (Q(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Hi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ji = /* @__PURE__ */ ds(Hi);
function $r(e) {
  return !!e || e === "";
}
function Ki(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = Vt(e[s], t[s]);
  return n;
}
function Vt(e, t) {
  if (e === t) return !0;
  let n = Vs(e), s = Vs(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = De(e), s = De(t), n || s)
    return e === t;
  if (n = Y(e), s = Y(t), n || s)
    return n && s ? Ki(e, t) : !1;
  if (n = Q(e), s = Q(t), n || s) {
    if (!n || !s)
      return !1;
    const r = Object.keys(e).length, i = Object.keys(t).length;
    if (r !== i)
      return !1;
    for (const l in e) {
      const a = e.hasOwnProperty(l), o = t.hasOwnProperty(l);
      if (a && !o || !a && o || !Vt(e[l], t[l]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function bs(e, t) {
  return e.findIndex((n) => Vt(n, t));
}
const Ir = (e) => !!(e && e.__v_isRef === !0), M = (e) => re(e) ? e : e == null ? "" : Y(e) || Q(e) && (e.toString === Ar || !H(e.toString)) ? Ir(e) ? M(e.value) : JSON.stringify(e, Or, 2) : String(e), Or = (e, t) => Ir(t) ? Or(e, t.value) : Ot(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, r], i) => (n[jn(s, i) + " =>"] = r, n),
    {}
  )
} : Yt(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => jn(n))
} : De(t) ? jn(t) : Q(t) && !Y(t) && !On(t) ? String(t) : t, jn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    De(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ce;
class qi {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && ce && (ce.active ? (this.parent = ce, this.index = (ce.scopes || (ce.scopes = [])).push(
      this
    ) - 1) : (this._active = !1, this._warnOnRun = !1));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let t, n;
      if (this.scopes) {
        const s = this.scopes.slice();
        for (t = 0, n = s.length; t < n; t++)
          s[t].pause();
      }
      for (t = 0, n = this.effects.length; t < n; t++)
        this.effects[t].pause();
    }
  }
  /**
   * Resumes the effect scope, including all child scopes and effects.
   */
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let t, n;
      if (this.scopes) {
        const r = this.scopes.slice();
        for (t = 0, n = r.length; t < n; t++)
          r[t].resume();
      }
      const s = this.effects.slice();
      for (t = 0, n = s.length; t < n; t++)
        s[t].resume();
    }
  }
  run(t) {
    if (this._active) {
      const n = ce;
      try {
        return ce = this, t();
      } finally {
        ce = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = ce, ce = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (ce === this)
        ce = this.prevScope;
      else {
        let t = ce;
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
      let n, s;
      for (n = 0, s = this.effects.length; n < s; n++)
        this.effects[n].stop();
      for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++)
        this.cleanups[n]();
      if (this.cleanups.length = 0, this.scopes) {
        const r = this.scopes.slice();
        for (n = 0, s = r.length; n < s; n++)
          r[n].stop(!0);
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
function Wi() {
  return ce;
}
let ne;
const Kn = /* @__PURE__ */ new WeakSet();
class Pr {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, ce && (ce.active ? ce.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Kn.has(this) && (Kn.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || Mr(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, Hs(this), Ur(this);
    const t = ne, n = Ue;
    ne = this, Ue = !0;
    try {
      return this.fn();
    } finally {
      Dr(this), ne = t, Ue = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        ms(t);
      this.deps = this.depsTail = void 0, Hs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Kn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    es(this) && this.run();
  }
  get dirty() {
    return es(this);
  }
}
let kr = 0, Jt, zt;
function Mr(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = zt, zt = e;
    return;
  }
  e.next = Jt, Jt = e;
}
function vs() {
  kr++;
}
function ys() {
  if (--kr > 0)
    return;
  if (zt) {
    let t = zt;
    for (zt = void 0; t; ) {
      const n = t.next;
      t.next = void 0, t.flags &= -9, t = n;
    }
  }
  let e;
  for (; Jt; ) {
    let t = Jt;
    for (Jt = void 0; t; ) {
      const n = t.next;
      if (t.next = void 0, t.flags &= -9, t.flags & 1)
        try {
          t.trigger();
        } catch (s) {
          e || (e = s);
        }
      t = n;
    }
  }
  if (e) throw e;
}
function Ur(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Dr(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const r = s.prevDep;
    s.version === -1 ? (s === n && (n = r), ms(s), Gi(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = r;
  }
  e.deps = t, e.depsTail = n;
}
function es(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Nr(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Nr(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === tn) || (e.globalVersion = tn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !es(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = ne, s = Ue;
  ne = e, Ue = !0;
  try {
    Ur(e);
    const r = e.fn(e._value);
    (t.version === 0 || We(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    ne = n, Ue = s, Dr(e), e.flags &= -3;
  }
}
function ms(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: r } = e;
  if (s && (s.nextSub = r, e.prevSub = void 0), r && (r.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      ms(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Gi(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Ue = !0;
const Lr = [];
function ot() {
  Lr.push(Ue), Ue = !1;
}
function lt() {
  const e = Lr.pop();
  Ue = e === void 0 ? !0 : e;
}
function Hs(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = ne;
    ne = void 0;
    try {
      t();
    } finally {
      ne = n;
    }
  }
}
let tn = 0;
class Ji {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class _s {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!ne || !Ue || ne === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== ne)
      n = this.activeLink = new Ji(ne, this), ne.deps ? (n.prevDep = ne.depsTail, ne.depsTail.nextDep = n, ne.depsTail = n) : ne.deps = ne.depsTail = n, Yr(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = ne.depsTail, n.nextDep = void 0, ne.depsTail.nextDep = n, ne.depsTail = n, ne.deps === n && (ne.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, tn++, this.notify(t);
  }
  notify(t) {
    vs();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      ys();
    }
  }
}
function Yr(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let s = t.deps; s; s = s.nextDep)
        Yr(s);
    }
    const n = e.dep.subs;
    n !== e && (e.prevSub = n, n && (n.nextSub = e)), e.dep.subs = e;
  }
}
const ts = /* @__PURE__ */ new WeakMap(), wt = /* @__PURE__ */ Symbol(
  ""
), ns = /* @__PURE__ */ Symbol(
  ""
), nn = /* @__PURE__ */ Symbol(
  ""
);
function he(e, t, n) {
  if (Ue && ne) {
    let s = ts.get(e);
    s || ts.set(e, s = /* @__PURE__ */ new Map());
    let r = s.get(n);
    r || (s.set(n, r = new _s()), r.map = s, r.key = n), r.track();
  }
}
function tt(e, t, n, s, r, i) {
  const l = ts.get(e);
  if (!l) {
    tn++;
    return;
  }
  const a = (o) => {
    o && o.trigger();
  };
  if (vs(), t === "clear")
    l.forEach(a);
  else {
    const o = Y(e), u = o && ps(n);
    if (o && n === "length") {
      const c = Number(s);
      l.forEach((p, v) => {
        (v === "length" || v === nn || !De(v) && v >= c) && a(p);
      });
    } else
      switch ((n !== void 0 || l.has(void 0)) && a(l.get(n)), u && a(l.get(nn)), t) {
        case "add":
          o ? u && a(l.get("length")) : (a(l.get(wt)), Ot(e) && a(l.get(ns)));
          break;
        case "delete":
          o || (a(l.get(wt)), Ot(e) && a(l.get(ns)));
          break;
        case "set":
          Ot(e) && a(l.get(wt));
          break;
      }
  }
  ys();
}
function Tt(e) {
  const t = /* @__PURE__ */ G(e);
  return t === e ? t : (he(t, "iterate", nn), /* @__PURE__ */ Oe(e) ? t : t.map(Ne));
}
function Un(e) {
  return he(e = /* @__PURE__ */ G(e), "iterate", nn), e;
}
function Ke(e, t) {
  return /* @__PURE__ */ at(e) ? Ut(/* @__PURE__ */ St(e) ? Ne(t) : t) : Ne(t);
}
const zi = {
  __proto__: null,
  [Symbol.iterator]() {
    return qn(this, Symbol.iterator, (e) => Ke(this, e));
  },
  concat(...e) {
    return Tt(this).concat(
      ...e.map((t) => Y(t) ? Tt(t) : t)
    );
  },
  entries() {
    return qn(this, "entries", (e) => (e[1] = Ke(this, e[1]), e));
  },
  every(e, t) {
    return Xe(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Xe(
      this,
      "filter",
      e,
      t,
      (n) => n.map((s) => Ke(this, s)),
      arguments
    );
  },
  find(e, t) {
    return Xe(
      this,
      "find",
      e,
      t,
      (n) => Ke(this, n),
      arguments
    );
  },
  findIndex(e, t) {
    return Xe(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Xe(
      this,
      "findLast",
      e,
      t,
      (n) => Ke(this, n),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Xe(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Xe(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return Wn(this, "includes", e);
  },
  indexOf(...e) {
    return Wn(this, "indexOf", e);
  },
  join(e) {
    return Tt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Wn(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Xe(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return Ht(this, "pop");
  },
  push(...e) {
    return Ht(this, "push", e);
  },
  reduce(e, ...t) {
    return js(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return js(this, "reduceRight", e, t);
  },
  shift() {
    return Ht(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Xe(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return Ht(this, "splice", e);
  },
  toReversed() {
    return Tt(this).toReversed();
  },
  toSorted(e) {
    return Tt(this).toSorted(e);
  },
  toSpliced(...e) {
    return Tt(this).toSpliced(...e);
  },
  unshift(...e) {
    return Ht(this, "unshift", e);
  },
  values() {
    return qn(this, "values", (e) => Ke(this, e));
  }
};
function qn(e, t, n) {
  const s = Un(e), r = s[t]();
  return s !== e && !/* @__PURE__ */ Oe(e) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.done || (i.value = n(i.value)), i;
  }), r;
}
const Qi = Array.prototype;
function Xe(e, t, n, s, r, i) {
  const l = Un(e), a = l !== e && !/* @__PURE__ */ Oe(e), o = l[t];
  if (o !== Qi[t]) {
    const p = o.apply(e, i);
    return a ? Ne(p) : p;
  }
  let u = n;
  l !== e && (a ? u = function(p, v) {
    return n.call(this, Ke(e, p), v, e);
  } : n.length > 2 && (u = function(p, v) {
    return n.call(this, p, v, e);
  }));
  const c = o.call(l, u, s);
  return a && r ? r(c) : c;
}
function js(e, t, n, s) {
  const r = Un(e), i = r !== e && !/* @__PURE__ */ Oe(e);
  let l = n, a = !1;
  r !== e && (i ? (a = s.length === 0, l = function(u, c, p) {
    return a && (a = !1, u = Ke(e, u)), n.call(this, u, Ke(e, c), p, e);
  }) : n.length > 3 && (l = function(u, c, p) {
    return n.call(this, u, c, p, e);
  }));
  const o = r[t](l, ...s);
  return a ? Ke(e, o) : o;
}
function Wn(e, t, n) {
  const s = /* @__PURE__ */ G(e);
  he(s, "iterate", nn);
  const r = s[t](...n);
  return (r === -1 || r === !1) && /* @__PURE__ */ xs(n[0]) ? (n[0] = /* @__PURE__ */ G(n[0]), s[t](...n)) : r;
}
function Ht(e, t, n = []) {
  ot(), vs();
  const s = (/* @__PURE__ */ G(e))[t].apply(e, n);
  return ys(), lt(), s;
}
const Xi = /* @__PURE__ */ ds("__proto__,__v_isRef,__isVue"), Vr = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(De)
);
function Zi(e) {
  De(e) || (e = String(e));
  const t = /* @__PURE__ */ G(this);
  return he(t, "has", e), t.hasOwnProperty(e);
}
class Fr {
  constructor(t = !1, n = !1) {
    this._isReadonly = t, this._isShallow = n;
  }
  get(t, n, s) {
    if (n === "__v_skip") return t.__v_skip;
    const r = this._isReadonly, i = this._isShallow;
    if (n === "__v_isReactive")
      return !r;
    if (n === "__v_isReadonly")
      return r;
    if (n === "__v_isShallow")
      return i;
    if (n === "__v_raw")
      return s === (r ? i ? uo : Kr : i ? jr : Hr).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(s) ? t : void 0;
    const l = Y(t);
    if (!r) {
      let o;
      if (l && (o = zi[n]))
        return o;
      if (n === "hasOwnProperty")
        return Zi;
    }
    const a = Reflect.get(
      t,
      n,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ ge(t) ? t : s
    );
    if ((De(n) ? Vr.has(n) : Xi(n)) || (r || he(t, "get", n), i))
      return a;
    if (/* @__PURE__ */ ge(a)) {
      const o = l && ps(n) ? a : a.value;
      return r && Q(o) ? /* @__PURE__ */ rs(o) : o;
    }
    return Q(a) ? r ? /* @__PURE__ */ rs(a) : /* @__PURE__ */ Ss(a) : a;
  }
}
class Br extends Fr {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, r) {
    let i = t[n];
    const l = Y(t) && ps(n);
    if (!this._isShallow) {
      const u = /* @__PURE__ */ at(i);
      if (!/* @__PURE__ */ Oe(s) && !/* @__PURE__ */ at(s) && (i = /* @__PURE__ */ G(i), s = /* @__PURE__ */ G(s)), !l && /* @__PURE__ */ ge(i) && !/* @__PURE__ */ ge(s))
        return u || (i.value = s), !0;
    }
    const a = l ? Number(n) < t.length : W(t, n), o = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ ge(t) ? t : r
    );
    return t === /* @__PURE__ */ G(r) && o && (a ? We(s, i) && tt(t, "set", n, s) : tt(t, "add", n, s)), o;
  }
  deleteProperty(t, n) {
    const s = W(t, n);
    t[n];
    const r = Reflect.deleteProperty(t, n);
    return r && s && tt(t, "delete", n, void 0), r;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!De(n) || !Vr.has(n)) && he(t, "has", n), s;
  }
  ownKeys(t) {
    return he(
      t,
      "iterate",
      Y(t) ? "length" : wt
    ), Reflect.ownKeys(t);
  }
}
class eo extends Fr {
  constructor(t = !1) {
    super(!0, t);
  }
  set(t, n) {
    return !0;
  }
  deleteProperty(t, n) {
    return !0;
  }
}
const to = /* @__PURE__ */ new Br(), no = /* @__PURE__ */ new eo(), so = /* @__PURE__ */ new Br(!0);
const ss = (e) => e, hn = (e) => Reflect.getPrototypeOf(e);
function ro(e, t, n) {
  return function(...s) {
    const r = this.__v_raw, i = /* @__PURE__ */ G(r), l = Ot(i), a = e === "entries" || e === Symbol.iterator && l, o = e === "keys" && l, u = r[e](...s), c = n ? ss : t ? Ut : Ne;
    return !t && he(
      i,
      "iterate",
      o ? ns : wt
    ), ie(
      // inheriting all iterator properties
      Object.create(u),
      {
        // iterator protocol
        next() {
          const { value: p, done: v } = u.next();
          return v ? { value: p, done: v } : {
            value: a ? [c(p[0]), c(p[1])] : c(p),
            done: v
          };
        }
      }
    );
  };
}
function pn(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function io(e, t) {
  const n = {
    get(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ G(i), a = /* @__PURE__ */ G(r);
      e || (We(r, a) && he(l, "get", r), he(l, "get", a));
      const { has: o } = hn(l), u = t ? ss : e ? Ut : Ne;
      if (o.call(l, r))
        return u(i.get(r));
      if (o.call(l, a))
        return u(i.get(a));
      i !== l && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && he(/* @__PURE__ */ G(r), "iterate", wt), r.size;
    },
    has(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ G(i), a = /* @__PURE__ */ G(r);
      return e || (We(r, a) && he(l, "has", r), he(l, "has", a)), r === a ? i.has(r) : i.has(r) || i.has(a);
    },
    forEach(r, i) {
      const l = this, a = l.__v_raw, o = /* @__PURE__ */ G(a), u = t ? ss : e ? Ut : Ne;
      return !e && he(o, "iterate", wt), a.forEach((c, p) => r.call(i, u(c), u(p), l));
    }
  };
  return ie(
    n,
    e ? {
      add: pn("add"),
      set: pn("set"),
      delete: pn("delete"),
      clear: pn("clear")
    } : {
      add(r) {
        const i = /* @__PURE__ */ G(this), l = hn(i), a = /* @__PURE__ */ G(r), o = !t && !/* @__PURE__ */ Oe(r) && !/* @__PURE__ */ at(r) ? a : r;
        return l.has.call(i, o) || We(r, o) && l.has.call(i, r) || We(a, o) && l.has.call(i, a) || (i.add(o), tt(i, "add", o, o)), this;
      },
      set(r, i) {
        !t && !/* @__PURE__ */ Oe(i) && !/* @__PURE__ */ at(i) && (i = /* @__PURE__ */ G(i));
        const l = /* @__PURE__ */ G(this), { has: a, get: o } = hn(l);
        let u = a.call(l, r);
        u || (r = /* @__PURE__ */ G(r), u = a.call(l, r));
        const c = o.call(l, r);
        return l.set(r, i), u ? We(i, c) && tt(l, "set", r, i) : tt(l, "add", r, i), this;
      },
      delete(r) {
        const i = /* @__PURE__ */ G(this), { has: l, get: a } = hn(i);
        let o = l.call(i, r);
        o || (r = /* @__PURE__ */ G(r), o = l.call(i, r)), a && a.call(i, r);
        const u = i.delete(r);
        return o && tt(i, "delete", r, void 0), u;
      },
      clear() {
        const r = /* @__PURE__ */ G(this), i = r.size !== 0, l = r.clear();
        return i && tt(
          r,
          "clear",
          void 0,
          void 0
        ), l;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((r) => {
    n[r] = ro(r, e, t);
  }), n;
}
function ws(e, t) {
  const n = io(e, t);
  return (s, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? s : Reflect.get(
    W(n, r) && r in s ? n : s,
    r,
    i
  );
}
const oo = {
  get: /* @__PURE__ */ ws(!1, !1)
}, lo = {
  get: /* @__PURE__ */ ws(!1, !0)
}, ao = {
  get: /* @__PURE__ */ ws(!0, !1)
};
const Hr = /* @__PURE__ */ new WeakMap(), jr = /* @__PURE__ */ new WeakMap(), Kr = /* @__PURE__ */ new WeakMap(), uo = /* @__PURE__ */ new WeakMap();
function co(e) {
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
function Ss(e) {
  return /* @__PURE__ */ at(e) ? e : Cs(
    e,
    !1,
    to,
    oo,
    Hr
  );
}
// @__NO_SIDE_EFFECTS__
function fo(e) {
  return Cs(
    e,
    !1,
    so,
    lo,
    jr
  );
}
// @__NO_SIDE_EFFECTS__
function rs(e) {
  return Cs(
    e,
    !0,
    no,
    ao,
    Kr
  );
}
function Cs(e, t, n, s, r) {
  if (!Q(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const i = r.get(e);
  if (i)
    return i;
  const l = co(Di(e));
  if (l === 0)
    return e;
  const a = new Proxy(
    e,
    l === 2 ? s : n
  );
  return r.set(e, a), a;
}
// @__NO_SIDE_EFFECTS__
function St(e) {
  return /* @__PURE__ */ at(e) ? /* @__PURE__ */ St(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function at(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function Oe(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function xs(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function G(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ G(t) : e;
}
function ho(e) {
  return !W(e, "__v_skip") && Object.isExtensible(e) && Tr(e, "__v_skip", !0), e;
}
const Ne = (e) => Q(e) ? /* @__PURE__ */ Ss(e) : e, Ut = (e) => Q(e) ? /* @__PURE__ */ rs(e) : e;
// @__NO_SIDE_EFFECTS__
function ge(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function B(e) {
  return po(e, !1);
}
function po(e, t) {
  return /* @__PURE__ */ ge(e) ? e : new go(e, t);
}
class go {
  constructor(t, n) {
    this.dep = new _s(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ G(t), this._value = n ? t : Ne(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ Oe(t) || /* @__PURE__ */ at(t);
    t = s ? t : /* @__PURE__ */ G(t), We(t, n) && (this._rawValue = t, this._value = s ? t : Ne(t), this.dep.trigger());
  }
}
function qr(e) {
  return /* @__PURE__ */ ge(e) ? e.value : e;
}
const bo = {
  get: (e, t, n) => t === "__v_raw" ? e : qr(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const r = e[t];
    return /* @__PURE__ */ ge(r) && !/* @__PURE__ */ ge(n) ? (r.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Wr(e) {
  return /* @__PURE__ */ St(e) ? e : new Proxy(e, bo);
}
class vo {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new _s(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = tn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    ne !== this)
      return Mr(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return Nr(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function yo(e, t, n = !1) {
  let s, r;
  return H(e) ? s = e : (s = e.get, r = e.set), new vo(s, r, n);
}
const gn = {}, mn = /* @__PURE__ */ new WeakMap();
let _t;
function mo(e, t = !1, n = _t) {
  if (n) {
    let s = mn.get(n);
    s || mn.set(n, s = []), s.push(e);
  }
}
function _o(e, t, n = Z) {
  const { immediate: s, deep: r, once: i, scheduler: l, augmentJob: a, call: o } = n, u = (y) => r ? y : /* @__PURE__ */ Oe(y) || r === !1 || r === 0 ? nt(y, 1) : nt(y);
  let c, p, v, b, C = !1, P = !1;
  if (/* @__PURE__ */ ge(e) ? (p = () => e.value, C = /* @__PURE__ */ Oe(e)) : /* @__PURE__ */ St(e) ? (p = () => u(e), C = !0) : Y(e) ? (P = !0, C = e.some((y) => /* @__PURE__ */ St(y) || /* @__PURE__ */ Oe(y)), p = () => e.map((y) => {
    if (/* @__PURE__ */ ge(y))
      return y.value;
    if (/* @__PURE__ */ St(y))
      return u(y);
    if (H(y))
      return o ? o(y, 2) : y();
  })) : H(e) ? t ? p = o ? () => o(e, 2) : e : p = () => {
    if (v) {
      ot();
      try {
        v();
      } finally {
        lt();
      }
    }
    const y = _t;
    _t = c;
    try {
      return o ? o(e, 3, [b]) : e(b);
    } finally {
      _t = y;
    }
  } : p = Ge, t && r) {
    const y = p, V = r === !0 ? 1 / 0 : r;
    p = () => nt(y(), V);
  }
  const j = Wi(), K = () => {
    c.stop(), j && j.active && hs(j.effects, c);
  };
  if (i && t) {
    const y = t;
    t = (...V) => {
      const de = y(...V);
      return K(), de;
    };
  }
  let $ = P ? new Array(e.length).fill(gn) : gn;
  const k = (y) => {
    if (!(!(c.flags & 1) || !c.dirty && !y))
      if (t) {
        const V = c.run();
        if (y || r || C || (P ? V.some((de, Te) => We(de, $[Te])) : We(V, $))) {
          v && v();
          const de = _t;
          _t = c;
          try {
            const Te = [
              V,
              // pass undefined as the old value when it's changed for the first time
              $ === gn ? void 0 : P && $[0] === gn ? [] : $,
              b
            ];
            $ = V, o ? o(t, 3, Te) : (
              // @ts-expect-error
              t(...Te)
            );
          } finally {
            _t = de;
          }
        }
      } else
        c.run();
  };
  return a && a(k), c = new Pr(p), c.scheduler = l ? () => l(k, !1) : k, b = (y) => mo(y, !1, c), v = c.onStop = () => {
    const y = mn.get(c);
    if (y) {
      if (o)
        o(y, 4);
      else
        for (const V of y) V();
      mn.delete(c);
    }
  }, t ? s ? k(!0) : $ = c.run() : l ? l(k.bind(null, !0), !0) : c.run(), K.pause = c.pause.bind(c), K.resume = c.resume.bind(c), K.stop = K, K;
}
function nt(e, t = 1 / 0, n) {
  if (t <= 0 || !Q(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ ge(e))
    nt(e.value, t, n);
  else if (Y(e))
    for (let s = 0; s < e.length; s++)
      nt(e[s], t, n);
  else if (Yt(e) || Ot(e))
    e.forEach((s) => {
      nt(s, t, n);
    });
  else if (On(e)) {
    for (const s in e)
      nt(e[s], t, n);
    for (const s of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, s) && nt(e[s], t, n);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function un(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (r) {
    Dn(r, t, n);
  }
}
function Le(e, t, n, s) {
  if (H(e)) {
    const r = un(e, t, n, s);
    return r && Er(r) && r.catch((i) => {
      Dn(i, t, n);
    }), r;
  }
  if (Y(e)) {
    const r = [];
    for (let i = 0; i < e.length; i++)
      r.push(Le(e[i], t, n, s));
    return r;
  }
}
function Dn(e, t, n, s = !0) {
  const r = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: l } = t && t.appContext.config || Z;
  if (t) {
    let a = t.parent;
    const o = t.proxy, u = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; a; ) {
      const c = a.ec;
      if (c) {
        for (let p = 0; p < c.length; p++)
          if (c[p](e, o, u) === !1)
            return;
      }
      a = a.parent;
    }
    if (i) {
      ot(), un(i, null, 10, [
        e,
        o,
        u
      ]), lt();
      return;
    }
  }
  wo(e, n, r, s, l);
}
function wo(e, t, n, s = !0, r = !1) {
  if (r)
    throw e;
  console.error(e);
}
const ve = [];
let je = -1;
const Pt = [];
let ht = null, $t = 0;
const Gr = /* @__PURE__ */ Promise.resolve();
let _n = null;
function cn(e) {
  const t = _n || Gr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function So(e) {
  let t = je + 1, n = ve.length;
  for (; t < n; ) {
    const s = t + n >>> 1, r = ve[s], i = sn(r);
    i < e || i === e && r.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Es(e) {
  if (!(e.flags & 1)) {
    const t = sn(e), n = ve[ve.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= sn(n) ? ve.push(e) : ve.splice(So(t), 0, e), e.flags |= 1, Jr();
  }
}
function Jr() {
  _n || (_n = Gr.then(Qr));
}
function Co(e) {
  Y(e) ? Pt.push(...e) : ht && e.id === -1 ? ht.splice($t + 1, 0, e) : e.flags & 1 || (Pt.push(e), e.flags |= 1), Jr();
}
function Ks(e, t, n = je + 1) {
  for (; n < ve.length; n++) {
    const s = ve[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      ve.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function zr(e) {
  if (Pt.length) {
    const t = [...new Set(Pt)].sort(
      (n, s) => sn(n) - sn(s)
    );
    if (Pt.length = 0, ht) {
      ht.push(...t);
      return;
    }
    for (ht = t, $t = 0; $t < ht.length; $t++) {
      const n = ht[$t];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    ht = null, $t = 0;
  }
}
const sn = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Qr(e) {
  try {
    for (je = 0; je < ve.length; je++) {
      const t = ve[je];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), un(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; je < ve.length; je++) {
      const t = ve[je];
      t && (t.flags &= -2);
    }
    je = -1, ve.length = 0, zr(), _n = null, (ve.length || Pt.length) && Qr();
  }
}
let pe = null, Xr = null;
function wn(e) {
  const t = pe;
  return pe = e, Xr = e && e.type.__scopeId || null, t;
}
function xt(e, t = pe, n) {
  if (!t || e._n)
    return e;
  const s = (...r) => {
    s._d && sr(-1);
    const i = wn(t), l = rt.length;
    let a;
    try {
      a = e(...r);
    } finally {
      for (let o = rt.length; o > l; o--) $s();
      wn(i), s._d && sr(1);
    }
    return a;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function Ct(e, t) {
  if (pe === null)
    return e;
  const n = Fn(pe), s = e.dirs || (e.dirs = []);
  for (let r = 0; r < t.length; r++) {
    let [i, l, a, o = Z] = t[r];
    i && (H(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && nt(l), s.push({
      dir: i,
      instance: n,
      value: l,
      oldValue: void 0,
      arg: a,
      modifiers: o
    }));
  }
  return e;
}
function yt(e, t, n, s) {
  const r = e.dirs, i = t && t.dirs;
  for (let l = 0; l < r.length; l++) {
    const a = r[l];
    i && (a.oldValue = i[l].value);
    let o = a.dir[s];
    o && (ot(), Le(o, n, 8, [
      e.el,
      a,
      e,
      t
    ]), lt());
  }
}
function xo(e, t) {
  if (ye) {
    let n = ye.provides;
    const s = ye.parent && ye.parent.provides;
    s === n && (n = ye.provides = Object.create(s)), n[e] = t;
  }
}
function vn(e, t, n = !1) {
  const s = Ai();
  if (s || Mt) {
    let r = Mt ? Mt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return n && H(t) ? t.call(s && s.proxy) : t;
  }
}
const Eo = /* @__PURE__ */ Symbol.for("v-scx"), Ao = () => vn(Eo);
function Je(e, t, n) {
  return Zr(e, t, n);
}
function Zr(e, t, n = Z) {
  const { immediate: s, deep: r, flush: i, once: l } = n, a = ie({}, n), o = t && s || !t && i !== "post";
  let u;
  if (on) {
    if (i === "sync") {
      const b = Ao();
      u = b.__watcherHandles || (b.__watcherHandles = []);
    } else if (!o) {
      const b = () => {
      };
      return b.stop = Ge, b.resume = Ge, b.pause = Ge, b;
    }
  }
  const c = ye;
  a.call = (b, C, P) => Le(b, c, C, P);
  let p = !1;
  i === "post" ? a.scheduler = (b) => {
    we(b, c && c.suspense);
  } : i !== "sync" && (p = !0, a.scheduler = (b, C) => {
    C ? b() : Es(b);
  }), a.augmentJob = (b) => {
    t && (b.flags |= 4), p && (b.flags |= 2, c && (b.id = c.uid, b.i = c));
  };
  const v = _o(e, t, a);
  return on && (u ? u.push(v) : o && v()), v;
}
function Ro(e, t, n) {
  const s = this.proxy, r = re(e) ? e.includes(".") ? ei(s, e) : () => s[e] : e.bind(s, s);
  let i;
  H(t) ? i = t : (i = t.handler, n = t);
  const l = fn(this), a = Zr(r, i.bind(s), n);
  return l(), a;
}
function ei(e, t) {
  const n = t.split(".");
  return () => {
    let s = e;
    for (let r = 0; r < n.length && s; r++)
      s = s[n[r]];
    return s;
  };
}
const To = /* @__PURE__ */ Symbol("_vte"), $o = (e) => e.__isTeleport, Gn = /* @__PURE__ */ Symbol("_leaveCb");
function As(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, As(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Re(e, t) {
  return H(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    ie({ name: e.name }, t, { setup: e })
  ) : e;
}
function ti() {
  const e = Ai();
  return e ? (e.appContext.config.idPrefix || "v") + "-" + e.ids[0] + e.ids[1]++ : "";
}
function ni(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function qs(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const Sn = /* @__PURE__ */ new WeakMap();
function Qt(e, t, n, s, r = !1) {
  if (Y(e)) {
    e.forEach(
      (P, j) => Qt(
        P,
        t && (Y(t) ? t[j] : t),
        n,
        s,
        r
      )
    );
    return;
  }
  if (kt(s) && !r) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Qt(e, t, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? Fn(s.component) : s.el, l = r ? null : i, { i: a, r: o } = e, u = t && t.r, c = a.refs === Z ? a.refs = {} : a.refs, p = a.setupState, v = /* @__PURE__ */ G(p), b = p === Z ? xr : (P) => qs(c, P) ? !1 : W(v, P), C = (P, j) => !(j && qs(c, j));
  if (u != null && u !== o) {
    if (Ws(t), re(u))
      c[u] = null, b(u) && (p[u] = null);
    else if (/* @__PURE__ */ ge(u)) {
      const P = t;
      C(u, P.k) && (u.value = null), P.k && (c[P.k] = null);
    }
  }
  if (H(o))
    un(o, a, 12, [l, c]);
  else {
    const P = re(o), j = /* @__PURE__ */ ge(o);
    if (P || j) {
      const K = () => {
        if (e.f) {
          const $ = P ? b(o) ? p[o] : c[o] : C() || !e.k ? o.value : c[e.k];
          if (r)
            Y($) && hs($, i);
          else if (Y($))
            $.includes(i) || $.push(i);
          else if (P)
            c[o] = [i], b(o) && (p[o] = c[o]);
          else {
            const k = [i];
            C(o, e.k) && (o.value = k), e.k && (c[e.k] = k);
          }
        } else P ? (c[o] = l, b(o) && (p[o] = l)) : j && (C(o, e.k) && (o.value = l), e.k && (c[e.k] = l));
      };
      if (l) {
        const $ = () => {
          K(), Sn.delete(e);
        };
        $.id = -1, Sn.set(e, $), we($, n);
      } else
        Ws(e), K();
    }
  }
}
function Ws(e) {
  const t = Sn.get(e);
  t && (t.flags |= 8, Sn.delete(e));
}
Mn().requestIdleCallback;
Mn().cancelIdleCallback;
const kt = (e) => !!e.type.__asyncLoader, si = (e) => e.type.__isKeepAlive;
function Io(e, t) {
  ri(e, "a", t);
}
function Oo(e, t) {
  ri(e, "da", t);
}
function ri(e, t, n = ye) {
  const s = e.__wdc || (e.__wdc = () => {
    let r = n;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (Nn(t, s, n), n) {
    let r = n.parent;
    for (; r && r.parent; )
      si(r.parent.vnode) && Po(s, t, n, r), r = r.parent;
  }
}
function Po(e, t, n, s) {
  const r = Nn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  ii(() => {
    hs(s[t], r);
  }, n);
}
function Nn(e, t, n = ye, s = !1) {
  if (n) {
    const r = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...l) => {
      ot();
      const a = fn(n), o = Le(t, n, e, l);
      return a(), lt(), o;
    });
    return s ? r.unshift(i) : r.push(i), i;
  }
}
const ct = (e) => (t, n = ye) => {
  (!on || e === "sp") && Nn(e, (...s) => t(...s), n);
}, ko = ct("bm"), Ln = ct("m"), Mo = ct(
  "bu"
), Uo = ct("u"), At = ct(
  "bum"
), ii = ct("um"), Do = ct(
  "sp"
), No = ct("rtg"), Lo = ct("rtc");
function Yo(e, t = ye) {
  Nn("ec", e, t);
}
const Vo = /* @__PURE__ */ Symbol.for("v-ndc");
function st(e, t, n, s) {
  let r;
  const i = n, l = Y(e);
  if (l || re(e)) {
    const a = l && /* @__PURE__ */ St(e);
    let o = !1, u = !1;
    a && (o = !/* @__PURE__ */ Oe(e), u = /* @__PURE__ */ at(e), e = Un(e)), r = new Array(e.length);
    for (let c = 0, p = e.length; c < p; c++)
      r[c] = t(
        o ? u ? Ut(Ne(e[c])) : Ne(e[c]) : e[c],
        c,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    r = new Array(e);
    for (let a = 0; a < e; a++)
      r[a] = t(a + 1, a, void 0, i);
  } else if (Q(e))
    if (e[Symbol.iterator])
      r = Array.from(
        e,
        (a, o) => t(a, o, void 0, i)
      );
    else {
      const a = Object.keys(e);
      r = new Array(a.length);
      for (let o = 0, u = a.length; o < u; o++) {
        const c = a[o];
        r[o] = t(e[c], c, o, i);
      }
    }
  else
    r = [];
  return r;
}
function Gs(e, t, n = {}, s, r, i) {
  if (pe.ce || pe.parent && kt(pe.parent) && pe.parent.ce) {
    const u = n, c = Object.keys(u).length > 0;
    return t !== "default" && (u.name = t), E(), Ee(
      ee,
      null,
      [le("slot", u, s)],
      c ? -2 : 64
    );
  }
  let l = e[t];
  l && l._c && (l._d = !1);
  const a = rt.length;
  E();
  let o;
  try {
    const u = l && oi(l(n)), c = n.key || i || // slot content array of a dynamic conditional slot may have a branch
    // key attached in the `createSlots` helper, respect that
    u && u.key;
    o = Ee(
      ee,
      {
        key: (c && !De(c) ? c : `_${t}`) + // #7256 force differentiate fallback content from actual content
        (!u && s ? "_fb" : "")
      },
      u || (s ? s() : []),
      u && e._ === 1 ? 64 : -2
    );
  } catch (u) {
    for (let c = rt.length; c > a; c--) $s();
    throw u;
  } finally {
    l && l._c && (l._d = !0);
  }
  return o.scopeId && (o.slotScopeIds = [o.scopeId + "-s"]), o;
}
function oi(e) {
  return e.some((t) => Is(t) ? !(t.type === ut || t.type === ee && !oi(t.children)) : !0) ? e : null;
}
const is = (e) => e ? Ri(e) ? Fn(e) : is(e.parent) : null, Xt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ ie(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => is(e.parent),
    $root: (e) => is(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ai(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Es(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = cn.bind(e.proxy)),
    $watch: (e) => Ro.bind(e)
  })
), Jn = (e, t) => e !== Z && !e.__isScriptSetup && W(e, t), Fo = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: r, props: i, accessCache: l, type: a, appContext: o } = e;
    if (t[0] !== "$") {
      const v = l[t];
      if (v !== void 0)
        switch (v) {
          case 1:
            return s[t];
          case 2:
            return r[t];
          case 4:
            return n[t];
          case 3:
            return i[t];
        }
      else {
        if (Jn(s, t))
          return l[t] = 1, s[t];
        if (r !== Z && W(r, t))
          return l[t] = 2, r[t];
        if (W(i, t))
          return l[t] = 3, i[t];
        if (n !== Z && W(n, t))
          return l[t] = 4, n[t];
        os && (l[t] = 0);
      }
    }
    const u = Xt[t];
    let c, p;
    if (u)
      return t === "$attrs" && he(e.attrs, "get", ""), u(e);
    if (
      // css module (injected by vue-loader)
      (c = a.__cssModules) && (c = c[t])
    )
      return c;
    if (n !== Z && W(n, t))
      return l[t] = 4, n[t];
    if (
      // global properties
      p = o.config.globalProperties, W(p, t)
    )
      return p[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: r, ctx: i } = e;
    return Jn(r, t) ? (r[t] = n, !0) : s !== Z && W(s, t) ? (s[t] = n, !0) : W(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: r, props: i, type: l }
  }, a) {
    let o;
    return !!(n[a] || e !== Z && a[0] !== "$" && W(e, a) || Jn(t, a) || W(i, a) || W(s, a) || W(Xt, a) || W(r.config.globalProperties, a) || (o = l.__cssModules) && o[a]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : W(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function Js(e) {
  return Y(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let os = !0;
function Bo(e) {
  const t = ai(e), n = e.proxy, s = e.ctx;
  os = !1, t.beforeCreate && zs(t.beforeCreate, e, "bc");
  const {
    // state
    data: r,
    computed: i,
    methods: l,
    watch: a,
    provide: o,
    inject: u,
    // lifecycle
    created: c,
    beforeMount: p,
    mounted: v,
    beforeUpdate: b,
    updated: C,
    activated: P,
    deactivated: j,
    beforeDestroy: K,
    beforeUnmount: $,
    destroyed: k,
    unmounted: y,
    render: V,
    renderTracked: de,
    renderTriggered: Te,
    errorCaptured: me,
    serverPrefetch: gt,
    // public API
    expose: Me,
    inheritAttrs: ft,
    // assets
    components: bt,
    directives: Rt,
    filters: dt
  } = t;
  if (u && Ho(u, s, null), l)
    for (const se in l) {
      const J = l[se];
      H(J) && (s[se] = J.bind(n));
    }
  if (r) {
    const se = r.call(n, n);
    Q(se) && (e.data = /* @__PURE__ */ Ss(se));
  }
  if (os = !0, i)
    for (const se in i) {
      const J = i[se], Ye = H(J) ? J.bind(n, n) : H(J.get) ? J.get.bind(n, n) : Ge, vt = !H(J) && H(J.set) ? J.set.bind(n) : Ge, ze = Nt({
        get: Ye,
        set: vt
      });
      Object.defineProperty(s, se, {
        enumerable: !0,
        configurable: !0,
        get: () => ze.value,
        set: ($e) => ze.value = $e
      });
    }
  if (a)
    for (const se in a)
      li(a[se], s, n, se);
  if (o) {
    const se = H(o) ? o.call(n) : o;
    Reflect.ownKeys(se).forEach((J) => {
      xo(J, se[J]);
    });
  }
  c && zs(c, e, "c");
  function ae(se, J) {
    Y(J) ? J.forEach((Ye) => se(Ye.bind(n))) : J && se(J.bind(n));
  }
  if (ae(ko, p), ae(Ln, v), ae(Mo, b), ae(Uo, C), ae(Io, P), ae(Oo, j), ae(Yo, me), ae(Lo, de), ae(No, Te), ae(At, $), ae(ii, y), ae(Do, gt), Y(Me))
    if (Me.length) {
      const se = e.exposed || (e.exposed = {});
      Me.forEach((J) => {
        Object.defineProperty(se, J, {
          get: () => n[J],
          set: (Ye) => n[J] = Ye,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  V && e.render === Ge && (e.render = V), ft != null && (e.inheritAttrs = ft), bt && (e.components = bt), Rt && (e.directives = Rt), gt && ni(e);
}
function Ho(e, t, n = Ge) {
  Y(e) && (e = ls(e));
  for (const s in e) {
    const r = e[s];
    let i;
    Q(r) ? "default" in r ? i = vn(
      r.from || s,
      r.default,
      !0
    ) : i = vn(r.from || s) : i = vn(r), /* @__PURE__ */ ge(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (l) => i.value = l
    }) : t[s] = i;
  }
}
function zs(e, t, n) {
  Le(
    Y(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function li(e, t, n, s) {
  let r = s.includes(".") ? ei(n, s) : () => n[s];
  if (re(e)) {
    const i = t[e];
    H(i) && Je(r, i);
  } else if (H(e))
    Je(r, e.bind(n));
  else if (Q(e))
    if (Y(e))
      e.forEach((i) => li(i, t, n, s));
    else {
      const i = H(e.handler) ? e.handler.bind(n) : t[e.handler];
      H(i) && Je(r, i, e);
    }
}
function ai(e) {
  const t = e.type, { mixins: n, extends: s } = t, {
    mixins: r,
    optionsCache: i,
    config: { optionMergeStrategies: l }
  } = e.appContext, a = i.get(t);
  let o;
  return a ? o = a : !r.length && !n && !s ? o = t : (o = {}, r.length && r.forEach(
    (u) => Cn(o, u, l, !0)
  ), Cn(o, t, l)), Q(t) && i.set(t, o), o;
}
function Cn(e, t, n, s = !1) {
  const { mixins: r, extends: i } = t;
  i && Cn(e, i, n, !0), r && r.forEach(
    (l) => Cn(e, l, n, !0)
  );
  for (const l in t)
    if (!(s && l === "expose")) {
      const a = jo[l] || n && n[l];
      e[l] = a ? a(e[l], t[l]) : t[l];
    }
  return e;
}
const jo = {
  data: Qs,
  props: Xs,
  emits: Xs,
  // objects
  methods: qt,
  computed: qt,
  // lifecycle
  beforeCreate: be,
  created: be,
  beforeMount: be,
  mounted: be,
  beforeUpdate: be,
  updated: be,
  beforeDestroy: be,
  beforeUnmount: be,
  destroyed: be,
  unmounted: be,
  activated: be,
  deactivated: be,
  errorCaptured: be,
  serverPrefetch: be,
  // assets
  components: qt,
  directives: qt,
  // watch
  watch: qo,
  // provide / inject
  provide: Qs,
  inject: Ko
};
function Qs(e, t) {
  return t ? e ? function() {
    return ie(
      H(e) ? e.call(this, this) : e,
      H(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Ko(e, t) {
  return qt(ls(e), ls(t));
}
function ls(e) {
  if (Y(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function be(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function qt(e, t) {
  return e ? ie(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Xs(e, t) {
  return e ? Y(e) && Y(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : ie(
    /* @__PURE__ */ Object.create(null),
    Js(e),
    Js(t ?? {})
  ) : t;
}
function qo(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = ie(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = be(e[s], t[s]);
  return n;
}
function ui() {
  return {
    app: null,
    config: {
      isNativeTag: xr,
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
let Wo = 0;
function Go(e, t) {
  return function(s, r = null) {
    H(s) || (s = ie({}, s)), r != null && !Q(r) && (r = null);
    const i = ui(), l = /* @__PURE__ */ new WeakSet(), a = [];
    let o = !1;
    const u = i.app = {
      _uid: Wo++,
      _component: s,
      _props: r,
      _container: null,
      _context: i,
      _instance: null,
      version: xl,
      get config() {
        return i.config;
      },
      set config(c) {
      },
      use(c, ...p) {
        return l.has(c) || (c && H(c.install) ? (l.add(c), c.install(u, ...p)) : H(c) && (l.add(c), c(u, ...p))), u;
      },
      mixin(c) {
        return i.mixins.includes(c) || i.mixins.push(c), u;
      },
      component(c, p) {
        return p ? (i.components[c] = p, u) : i.components[c];
      },
      directive(c, p) {
        return p ? (i.directives[c] = p, u) : i.directives[c];
      },
      mount(c, p, v) {
        if (!o) {
          const b = u._ceVNode || le(s, r);
          return b.appContext = i, v === !0 ? v = "svg" : v === !1 && (v = void 0), e(b, c, v), o = !0, u._container = c, c.__vue_app__ = u, Fn(b.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        o && (Le(
          a,
          u._instance,
          16
        ), e(null, u._container), delete u._container.__vue_app__);
      },
      provide(c, p) {
        return i.provides[c] = p, u;
      },
      runWithContext(c) {
        const p = Mt;
        Mt = u;
        try {
          return c();
        } finally {
          Mt = p;
        }
      }
    };
    return u;
  };
}
let Mt = null;
const Jo = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ce(t)}Modifiers`] || e[`${Ie(t)}Modifiers`];
function zo(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || Z;
  let r = n;
  const i = t.startsWith("update:"), l = i && Jo(s, t.slice(7));
  l && (l.trim && (r = n.map((c) => re(c) ? c.trim() : c)), l.number && (r = n.map(kn)));
  let a, o = s[a = Hn(t)] || // also try camelCase event handler (#2249)
  s[a = Hn(Ce(t))];
  !o && i && (o = s[a = Hn(Ie(t))]), o && Le(
    o,
    e,
    6,
    r
  );
  const u = s[a + "Once"];
  if (u) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, Le(
      u,
      e,
      6,
      r
    );
  }
}
const Qo = /* @__PURE__ */ new WeakMap();
function ci(e, t, n = !1) {
  const s = n ? Qo : t.emitsCache, r = s.get(e);
  if (r !== void 0)
    return r;
  const i = e.emits;
  let l = {}, a = !1;
  if (!H(e)) {
    const o = (u) => {
      const c = ci(u, t, !0);
      c && (a = !0, ie(l, c));
    };
    !n && t.mixins.length && t.mixins.forEach(o), e.extends && o(e.extends), e.mixins && e.mixins.forEach(o);
  }
  return !i && !a ? (Q(e) && s.set(e, null), null) : (Y(i) ? i.forEach((o) => l[o] = null) : ie(l, i), Q(e) && s.set(e, l), l);
}
function Yn(e, t) {
  return !e || !$n(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), W(e, t[0].toLowerCase() + t.slice(1)) || W(e, Ie(t)) || W(e, t));
}
function Zs(e) {
  const {
    type: t,
    vnode: n,
    proxy: s,
    withProxy: r,
    propsOptions: [i],
    slots: l,
    attrs: a,
    emit: o,
    render: u,
    renderCache: c,
    props: p,
    data: v,
    setupState: b,
    ctx: C,
    inheritAttrs: P
  } = e, j = wn(e);
  let K, $;
  try {
    if (n.shapeFlag & 4) {
      const y = r || s, V = y;
      K = qe(
        u.call(
          V,
          y,
          c,
          p,
          b,
          v,
          C
        )
      ), $ = a;
    } else {
      const y = t;
      K = qe(
        y.length > 1 ? y(
          p,
          { attrs: a, slots: l, emit: o }
        ) : y(
          p,
          null
        )
      ), $ = t.props ? a : Xo(a);
    }
  } catch (y) {
    rt.length = 0, Dn(y, e, 1), K = le(ut);
  }
  let k = K;
  if ($ && P !== !1) {
    const y = Object.keys($), { shapeFlag: V } = k;
    y.length && V & 7 && (i && y.some(In) && ($ = Zo(
      $,
      i
    )), k = Dt(k, $, !1, !0));
  }
  return n.dirs && (k = Dt(k, null, !1, !0), k.dirs = k.dirs ? k.dirs.concat(n.dirs) : n.dirs), n.transition && As(k, n.transition), K = k, wn(j), K;
}
const Xo = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || $n(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Zo = (e, t) => {
  const n = {};
  for (const s in e)
    (!In(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
  return n;
};
function el(e, t, n) {
  const { props: s, children: r, component: i } = e, { props: l, children: a, patchFlag: o } = t, u = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (n && o >= 0) {
    if (o & 1024)
      return !0;
    if (o & 16)
      return s ? er(s, l, u) : !!l;
    if (o & 8) {
      const c = t.dynamicProps;
      for (let p = 0; p < c.length; p++) {
        const v = c[p];
        if (fi(l, s, v) && !Yn(u, v))
          return !0;
      }
    }
  } else
    return (r || a) && (!a || !a.$stable) ? !0 : s === l ? !1 : s ? l ? er(s, l, u) : !0 : !!l;
  return !1;
}
function er(e, t, n) {
  const s = Object.keys(t);
  if (s.length !== Object.keys(e).length)
    return !0;
  for (let r = 0; r < s.length; r++) {
    const i = s[r];
    if (fi(t, e, i) && !Yn(n, i))
      return !0;
  }
  return !1;
}
function fi(e, t, n) {
  const s = e[n], r = t[n];
  return n === "style" && Q(s) && Q(r) ? !Vt(s, r) : s !== r;
}
function tl({ vnode: e, parent: t, suspense: n }, s) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.suspense.vnode.el = r.el = s, e = r), r === e)
      (e = t.vnode).el = s, t = t.parent;
    else
      break;
  }
  n && n.activeBranch === e && (n.vnode.el = s);
}
const di = {}, hi = () => Object.create(di), pi = (e) => Object.getPrototypeOf(e) === di;
function nl(e, t, n, s = !1) {
  const r = {}, i = hi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), gi(e, t, r, i);
  for (const l in e.propsOptions[0])
    l in r || (r[l] = void 0);
  n ? e.props = s ? r : /* @__PURE__ */ fo(r) : e.type.props ? e.props = r : e.props = i, e.attrs = i;
}
function sl(e, t, n, s) {
  const {
    props: r,
    attrs: i,
    vnode: { patchFlag: l }
  } = e, a = /* @__PURE__ */ G(r), [o] = e.propsOptions;
  let u = !1;
  if (
    // always force full diff in dev
    // - #1942 if hmr is enabled with sfc component
    // - vite#872 non-sfc component used by sfc component
    (s || l > 0) && !(l & 16)
  ) {
    if (l & 8) {
      const c = e.vnode.dynamicProps;
      for (let p = 0; p < c.length; p++) {
        let v = c[p];
        if (Yn(e.emitsOptions, v))
          continue;
        const b = t[v];
        if (o)
          if (W(i, v))
            b !== i[v] && (i[v] = b, u = !0);
          else {
            const C = Ce(v);
            r[C] = as(
              o,
              a,
              C,
              b,
              e,
              !1
            );
          }
        else
          b !== i[v] && (i[v] = b, u = !0);
      }
    }
  } else {
    gi(e, t, r, i) && (u = !0);
    let c;
    for (const p in a)
      (!t || // for camelCase
      !W(t, p) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = Ie(p)) === p || !W(t, c))) && (o ? n && // for camelCase
      (n[p] !== void 0 || // for kebab-case
      n[c] !== void 0) && (r[p] = as(
        o,
        a,
        p,
        void 0,
        e,
        !0
      )) : delete r[p]);
    if (i !== a)
      for (const p in i)
        (!t || !W(t, p)) && (delete i[p], u = !0);
  }
  u && tt(e.attrs, "set", "");
}
function gi(e, t, n, s) {
  const [r, i] = e.propsOptions;
  let l = !1, a;
  if (t)
    for (let o in t) {
      if (Gt(o))
        continue;
      const u = t[o];
      let c;
      r && W(r, c = Ce(o)) ? !i || !i.includes(c) ? n[c] = u : (a || (a = {}))[c] = u : Yn(e.emitsOptions, o) || (!(o in s) || u !== s[o]) && (s[o] = u, l = !0);
    }
  if (i) {
    const o = /* @__PURE__ */ G(n), u = a || Z;
    for (let c = 0; c < i.length; c++) {
      const p = i[c];
      n[p] = as(
        r,
        o,
        p,
        u[p],
        e,
        !W(u, p)
      );
    }
  }
  return l;
}
function as(e, t, n, s, r, i) {
  const l = e[n];
  if (l != null) {
    const a = W(l, "default");
    if (a && s === void 0) {
      const o = l.default;
      if (l.type !== Function && !l.skipFactory && H(o)) {
        const { propsDefaults: u } = r;
        if (n in u)
          s = u[n];
        else {
          const c = fn(r);
          s = u[n] = o.call(
            null,
            t
          ), c();
        }
      } else
        s = o;
      r.ce && r.ce._setProp(n, s);
    }
    l[
      0
      /* shouldCast */
    ] && (i && !a ? s = !1 : l[
      1
      /* shouldCastTrue */
    ] && (s === "" || s === Ie(n)) && (s = !0));
  }
  return s;
}
const rl = /* @__PURE__ */ new WeakMap();
function bi(e, t, n = !1) {
  const s = n ? rl : t.propsCache, r = s.get(e);
  if (r)
    return r;
  const i = e.props, l = {}, a = [];
  let o = !1;
  if (!H(e)) {
    const c = (p) => {
      o = !0;
      const [v, b] = bi(p, t, !0);
      ie(l, v), b && a.push(...b);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!i && !o)
    return Q(e) && s.set(e, It), It;
  if (Y(i))
    for (let c = 0; c < i.length; c++) {
      const p = Ce(i[c]);
      tr(p) && (l[p] = Z);
    }
  else if (i)
    for (const c in i) {
      const p = Ce(c);
      if (tr(p)) {
        const v = i[c], b = l[p] = Y(v) || H(v) ? { type: v } : ie({}, v), C = b.type;
        let P = !1, j = !0;
        if (Y(C))
          for (let K = 0; K < C.length; ++K) {
            const $ = C[K], k = H($) && $.name;
            if (k === "Boolean") {
              P = !0;
              break;
            } else k === "String" && (j = !1);
          }
        else
          P = H(C) && C.name === "Boolean";
        b[
          0
          /* shouldCast */
        ] = P, b[
          1
          /* shouldCastTrue */
        ] = j, (P || W(b, "default")) && a.push(p);
      }
    }
  const u = [l, a];
  return Q(e) && s.set(e, u), u;
}
function tr(e) {
  return e[0] !== "$" && !Gt(e);
}
const Rs = (e) => e === "_" || e === "_ctx" || e === "$stable", Ts = (e) => Y(e) ? e.map(qe) : [qe(e)], il = (e, t, n) => {
  if (t._n)
    return t;
  const s = xt((...r) => Ts(t(...r)), n);
  return s._c = !1, s;
}, vi = (e, t, n) => {
  const s = e._ctx;
  for (const r in e) {
    if (Rs(r)) continue;
    const i = e[r];
    if (H(i))
      t[r] = il(r, i, s);
    else if (i != null) {
      const l = Ts(i);
      t[r] = () => l;
    }
  }
}, yi = (e, t) => {
  const n = Ts(t);
  e.slots.default = () => n;
}, mi = (e, t, n) => {
  for (const s in t)
    (n || !Rs(s)) && (e[s] = t[s]);
}, ol = (e, t, n) => {
  const s = e.slots = hi();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (mi(s, t, n), n && Tr(s, "_", r, !0)) : vi(t, s);
  } else t && yi(e, t);
}, ll = (e, t, n) => {
  const { vnode: s, slots: r } = e;
  let i = !0, l = Z;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? i = !1 : mi(r, t, n) : (i = !t.$stable, vi(t, r)), l = t;
  } else t && (yi(e, t), l = { default: 1 });
  if (i)
    for (const a in r)
      !Rs(a) && l[a] == null && delete r[a];
}, we = dl;
function al(e) {
  return ul(e);
}
function ul(e, t) {
  const n = Mn();
  n.__VUE__ = !0;
  const {
    insert: s,
    remove: r,
    patchProp: i,
    createElement: l,
    createText: a,
    createComment: o,
    setText: u,
    setElementText: c,
    parentNode: p,
    nextSibling: v,
    setScopeId: b = Ge,
    insertStaticContent: C
  } = e, P = (f, h, g, S = null, w = null, m = null, R = void 0, A = null, x = !!h.dynamicChildren) => {
    if (f === h)
      return;
    f && !jt(f, h) && (S = Qe(f), $e(f, w, m, !0), f = null), h.patchFlag === -2 && (x = !1, h.dynamicChildren = null);
    const { type: _, ref: L, shapeFlag: I } = h;
    switch (_) {
      case Vn:
        j(f, h, g, S);
        break;
      case ut:
        K(f, h, g, S);
        break;
      case Qn:
        f == null && $(h, g, S, R);
        break;
      case ee:
        bt(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          A,
          x
        );
        break;
      default:
        I & 1 ? V(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          A,
          x
        ) : I & 6 ? Rt(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          A,
          x
        ) : (I & 64 || I & 128) && _.process(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          A,
          x,
          Ft
        );
    }
    L != null && w ? Qt(L, f && f.ref, m, h || f, !h) : L == null && f && f.ref != null && Qt(f.ref, null, m, f, !0);
  }, j = (f, h, g, S) => {
    if (f == null)
      s(
        h.el = a(h.children),
        g,
        S
      );
    else {
      const w = h.el = f.el;
      h.children !== f.children && u(w, h.children);
    }
  }, K = (f, h, g, S) => {
    f == null ? s(
      h.el = o(h.children || ""),
      g,
      S
    ) : h.el = f.el;
  }, $ = (f, h, g, S) => {
    [f.el, f.anchor] = C(
      f.children,
      h,
      g,
      S,
      f.el,
      f.anchor
    );
  }, k = ({ el: f, anchor: h }, g, S) => {
    let w;
    for (; f && f !== h; )
      w = v(f), s(f, g, S), f = w;
    s(h, g, S);
  }, y = ({ el: f, anchor: h }) => {
    let g;
    for (; f && f !== h; )
      g = v(f), r(f), f = g;
    r(h);
  }, V = (f, h, g, S, w, m, R, A, x) => {
    if (h.type === "svg" ? R = "svg" : h.type === "math" && (R = "mathml"), f == null)
      de(
        h,
        g,
        S,
        w,
        m,
        R,
        A,
        x
      );
    else {
      const _ = f.el && f.el._isVueCE ? f.el : null;
      try {
        _ && _._beginPatch(), gt(
          f,
          h,
          w,
          m,
          R,
          A,
          x
        );
      } finally {
        _ && _._endPatch();
      }
    }
  }, de = (f, h, g, S, w, m, R, A) => {
    let x, _;
    const { props: L, shapeFlag: I, transition: D, dirs: F } = f;
    if (x = f.el = l(
      f.type,
      m,
      L && L.is,
      L
    ), I & 8 ? c(x, f.children) : I & 16 && me(
      f.children,
      x,
      null,
      S,
      w,
      zn(f, m),
      R,
      A
    ), F && yt(f, null, S, "created"), Te(x, f, f.scopeId, R, S), L) {
      for (const X in L)
        X !== "value" && !Gt(X) && i(x, X, null, L[X], m, S);
      "value" in L && i(x, "value", null, L.value, m), (_ = L.onVnodeBeforeMount) && He(_, S, f);
    }
    F && yt(f, null, S, "beforeMount");
    const q = cl(w, D);
    q && D.beforeEnter(x), s(x, h, g), ((_ = L && L.onVnodeMounted) || q || F) && we(() => {
      try {
        _ && He(_, S, f), q && D.enter(x), F && yt(f, null, S, "mounted");
      } finally {
      }
    }, w);
  }, Te = (f, h, g, S, w) => {
    if (g && b(f, g), S)
      for (let m = 0; m < S.length; m++)
        b(f, S[m]);
    if (w) {
      let m = w.subTree;
      if (h === m || Ci(m.type) && (m.ssContent === h || m.ssFallback === h)) {
        const R = w.vnode;
        Te(
          f,
          R,
          R.scopeId,
          R.slotScopeIds,
          w.parent
        );
      }
    }
  }, me = (f, h, g, S, w, m, R, A, x = 0) => {
    for (let _ = x; _ < f.length; _++) {
      const L = f[_] = A ? et(f[_]) : qe(f[_]);
      P(
        null,
        L,
        h,
        g,
        S,
        w,
        m,
        R,
        A
      );
    }
  }, gt = (f, h, g, S, w, m, R) => {
    const A = h.el = f.el;
    let { patchFlag: x, dynamicChildren: _, dirs: L } = h;
    x |= f.patchFlag & 16;
    const I = f.props || Z, D = h.props || Z;
    let F;
    if (g && mt(g, !1), (F = D.onVnodeBeforeUpdate) && He(F, g, h, f), L && yt(h, f, g, "beforeUpdate"), g && mt(g, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    _ && (!f.dynamicChildren || f.dynamicChildren.length !== _.length) && (x = 0, R = !1, _ = null), (I.innerHTML && D.innerHTML == null || I.textContent && D.textContent == null) && c(A, ""), _ ? Me(
      f.dynamicChildren,
      _,
      A,
      g,
      S,
      zn(h, w),
      m
    ) : R || J(
      f,
      h,
      A,
      null,
      g,
      S,
      zn(h, w),
      m,
      !1
    ), x > 0) {
      if (x & 16)
        ft(A, I, D, g, w);
      else if (x & 2 && I.class !== D.class && i(A, "class", null, D.class, w), x & 4 && i(A, "style", I.style, D.style, w), x & 8) {
        const q = h.dynamicProps;
        for (let X = 0; X < q.length; X++) {
          const z = q[X], oe = I[z], ue = D[z];
          (ue !== oe || z === "value") && i(A, z, oe, ue, w, g);
        }
      }
      x & 1 && f.children !== h.children && c(A, h.children);
    } else !R && _ == null && ft(A, I, D, g, w);
    ((F = D.onVnodeUpdated) || L) && we(() => {
      F && He(F, g, h, f), L && yt(h, f, g, "updated");
    }, S);
  }, Me = (f, h, g, S, w, m, R) => {
    for (let A = 0; A < h.length; A++) {
      const x = f[A], _ = h[A], L = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        x.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (x.type === ee || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !jt(x, _) || // - In the case of a component, it could contain anything.
        x.shapeFlag & 198) ? p(x.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      P(
        x,
        _,
        L,
        null,
        S,
        w,
        m,
        R,
        !0
      );
    }
  }, ft = (f, h, g, S, w) => {
    if (h !== g) {
      if (h !== Z)
        for (const m in h)
          !Gt(m) && !(m in g) && i(
            f,
            m,
            h[m],
            null,
            w,
            S
          );
      for (const m in g) {
        if (Gt(m)) continue;
        const R = g[m], A = h[m];
        R !== A && m !== "value" && i(f, m, A, R, w, S);
      }
      "value" in g && i(f, "value", h.value, g.value, w);
    }
  }, bt = (f, h, g, S, w, m, R, A, x) => {
    const _ = h.el = f ? f.el : a(""), L = h.anchor = f ? f.anchor : a("");
    let { patchFlag: I, dynamicChildren: D, slotScopeIds: F } = h;
    F && (A = A ? A.concat(F) : F), f == null ? (s(_, g, S), s(L, g, S), me(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      h.children || [],
      g,
      L,
      w,
      m,
      R,
      A,
      x
    )) : I > 0 && I & 64 && D && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    f.dynamicChildren && f.dynamicChildren.length === D.length ? (Me(
      f.dynamicChildren,
      D,
      g,
      w,
      m,
      R,
      A
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (h.key != null || w && h === w.subTree) && _i(
      f,
      h,
      !0
      /* shallow */
    )) : J(
      f,
      h,
      g,
      L,
      w,
      m,
      R,
      A,
      x
    );
  }, Rt = (f, h, g, S, w, m, R, A, x) => {
    h.slotScopeIds = A, f == null ? h.shapeFlag & 512 ? w.ctx.activate(
      h,
      g,
      S,
      R,
      x
    ) : dt(
      h,
      g,
      S,
      w,
      m,
      R,
      x
    ) : dn(f, h, x);
  }, dt = (f, h, g, S, w, m, R) => {
    const A = f.component = yl(
      f,
      S,
      w
    );
    if (si(f) && (A.ctx.renderer = Ft), ml(A, !1, R), A.asyncDep) {
      if (w && w.registerDep(A, ae, R), !f.el) {
        const x = A.subTree = le(ut);
        K(null, x, h, g), f.placeholder = x.el;
      }
    } else
      ae(
        A,
        f,
        h,
        g,
        w,
        m,
        R
      );
  }, dn = (f, h, g) => {
    const S = h.component = f.component;
    if (el(f, h, g))
      if (S.asyncDep && !S.asyncResolved) {
        se(S, h, g);
        return;
      } else
        S.next = h, S.update();
    else
      h.el = f.el, S.vnode = h;
  }, ae = (f, h, g, S, w, m, R) => {
    const A = () => {
      if (f.isMounted) {
        let { next: I, bu: D, u: F, parent: q, vnode: X } = f;
        {
          const Fe = wi(f);
          if (Fe) {
            I && (I.el = X.el, se(f, I, R)), Fe.asyncDep.then(() => {
              we(() => {
                f.isUnmounted || _();
              }, w);
            });
            return;
          }
        }
        let z = I, oe;
        mt(f, !1), I ? (I.el = X.el, se(f, I, R)) : I = X, D && bn(D), (oe = I.props && I.props.onVnodeBeforeUpdate) && He(oe, q, I, X), mt(f, !0);
        const ue = Zs(f), Ve = f.subTree;
        f.subTree = ue, P(
          Ve,
          ue,
          // parent may have changed if it's in a teleport
          p(Ve.el),
          // anchor may have changed if it's in a fragment
          Qe(Ve),
          f,
          w,
          m
        ), I.el = ue.el, z === null && tl(f, ue.el), F && we(F, w), (oe = I.props && I.props.onVnodeUpdated) && we(
          () => He(oe, q, I, X),
          w
        );
      } else {
        let I;
        const { el: D, props: F } = h, { bm: q, m: X, parent: z, root: oe, type: ue } = f, Ve = kt(h);
        mt(f, !1), q && bn(q), !Ve && (I = F && F.onVnodeBeforeMount) && He(I, z, h), mt(f, !0);
        {
          oe.ce && oe.ce._hasShadowRoot() && oe.ce._injectChildStyle(
            ue,
            f.parent ? f.parent.type : void 0
          );
          const Fe = f.subTree = Zs(f);
          P(
            null,
            Fe,
            g,
            S,
            f,
            w,
            m
          ), h.el = Fe.el;
        }
        if (X && we(X, w), !Ve && (I = F && F.onVnodeMounted)) {
          const Fe = h;
          we(
            () => He(I, z, Fe),
            w
          );
        }
        (h.shapeFlag & 256 || z && kt(z.vnode) && z.vnode.shapeFlag & 256) && f.a && we(f.a, w), f.isMounted = !0, h = g = S = null;
      }
    };
    f.scope.on();
    const x = f.effect = new Pr(A);
    f.scope.off();
    const _ = f.update = x.run.bind(x), L = f.job = x.runIfDirty.bind(x);
    L.i = f, L.id = f.uid, x.scheduler = () => Es(L), mt(f, !0), _();
  }, se = (f, h, g) => {
    h.component = f;
    const S = f.vnode.props;
    f.vnode = h, f.next = null, sl(f, h.props, S, g), ll(f, h.children, g), ot(), Ks(f), lt();
  }, J = (f, h, g, S, w, m, R, A, x = !1) => {
    const _ = f && f.children, L = f ? f.shapeFlag : 0, I = h.children, { patchFlag: D, shapeFlag: F } = h;
    if (D > 0) {
      if (D & 128) {
        vt(
          _,
          I,
          g,
          S,
          w,
          m,
          R,
          A,
          x
        );
        return;
      } else if (D & 256) {
        Ye(
          _,
          I,
          g,
          S,
          w,
          m,
          R,
          A,
          x
        );
        return;
      }
    }
    F & 8 ? (L & 16 && _e(_, w, m), I !== _ && c(g, I)) : L & 16 ? F & 16 ? vt(
      _,
      I,
      g,
      S,
      w,
      m,
      R,
      A,
      x
    ) : _e(_, w, m, !0) : (L & 8 && c(g, ""), F & 16 && me(
      I,
      g,
      S,
      w,
      m,
      R,
      A,
      x
    ));
  }, Ye = (f, h, g, S, w, m, R, A, x) => {
    f = f || It, h = h || It;
    const _ = f.length, L = h.length, I = Math.min(_, L);
    let D;
    for (D = 0; D < I; D++) {
      const F = h[D] = x ? et(h[D]) : qe(h[D]);
      P(
        f[D],
        F,
        g,
        null,
        w,
        m,
        R,
        A,
        x
      );
    }
    _ > L ? _e(
      f,
      w,
      m,
      !0,
      !1,
      I
    ) : me(
      h,
      g,
      S,
      w,
      m,
      R,
      A,
      x,
      I
    );
  }, vt = (f, h, g, S, w, m, R, A, x) => {
    let _ = 0;
    const L = h.length;
    let I = f.length - 1, D = L - 1;
    for (; _ <= I && _ <= D; ) {
      const F = f[_], q = h[_] = x ? et(h[_]) : qe(h[_]);
      if (jt(F, q))
        P(
          F,
          q,
          g,
          null,
          w,
          m,
          R,
          A,
          x
        );
      else
        break;
      _++;
    }
    for (; _ <= I && _ <= D; ) {
      const F = f[I], q = h[D] = x ? et(h[D]) : qe(h[D]);
      if (jt(F, q))
        P(
          F,
          q,
          g,
          null,
          w,
          m,
          R,
          A,
          x
        );
      else
        break;
      I--, D--;
    }
    if (_ > I) {
      if (_ <= D) {
        const F = D + 1, q = F < L ? h[F].el : S;
        for (; _ <= D; )
          P(
            null,
            h[_] = x ? et(h[_]) : qe(h[_]),
            g,
            q,
            w,
            m,
            R,
            A,
            x
          ), _++;
      }
    } else if (_ > D)
      for (; _ <= I; )
        $e(f[_], w, m, !0), _++;
    else {
      const F = _, q = _, X = /* @__PURE__ */ new Map();
      for (_ = q; _ <= D; _++) {
        const xe = h[_] = x ? et(h[_]) : qe(h[_]);
        xe.key != null && X.set(xe.key, _);
      }
      let z, oe = 0;
      const ue = D - q + 1;
      let Ve = !1, Fe = 0;
      const Bt = new Array(ue);
      for (_ = 0; _ < ue; _++) Bt[_] = 0;
      for (_ = F; _ <= I; _++) {
        const xe = f[_];
        if (oe >= ue) {
          $e(xe, w, m, !0);
          continue;
        }
        let Be;
        if (xe.key != null)
          Be = X.get(xe.key);
        else
          for (z = q; z <= D; z++)
            if (Bt[z - q] === 0 && jt(xe, h[z])) {
              Be = z;
              break;
            }
        Be === void 0 ? $e(xe, w, m, !0) : (Bt[Be - q] = _ + 1, Be >= Fe ? Fe = Be : Ve = !0, P(
          xe,
          h[Be],
          g,
          null,
          w,
          m,
          R,
          A,
          x
        ), oe++);
      }
      const Ns = Ve ? fl(Bt) : It;
      for (z = Ns.length - 1, _ = ue - 1; _ >= 0; _--) {
        const xe = q + _, Be = h[xe], Ls = h[xe + 1], Ys = xe + 1 < L ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Ls.el || Si(Ls)
        ) : S;
        Bt[_] === 0 ? P(
          null,
          Be,
          g,
          Ys,
          w,
          m,
          R,
          A,
          x
        ) : Ve && (z < 0 || _ !== Ns[z] ? ze(Be, g, Ys, 2) : z--);
      }
    }
  }, ze = (f, h, g, S, w = null) => {
    const { el: m, type: R, transition: A, children: x, shapeFlag: _ } = f;
    if (_ & 6) {
      ze(f.component.subTree, h, g, S);
      return;
    }
    if (_ & 128) {
      f.suspense.move(h, g, S);
      return;
    }
    if (_ & 64) {
      R.move(f, h, g, Ft);
      return;
    }
    if (R === ee) {
      s(m, h, g);
      for (let I = 0; I < x.length; I++)
        ze(x[I], h, g, S);
      s(f.anchor, h, g);
      return;
    }
    if (R === Qn) {
      k(f, h, g);
      return;
    }
    if (S !== 2 && _ & 1 && A)
      if (S === 0)
        A.persisted && !m[Gn] ? s(m, h, g) : (A.beforeEnter(m), s(m, h, g), we(() => A.enter(m), w));
      else {
        const { leave: I, delayLeave: D, afterLeave: F } = A, q = () => {
          f.ctx.isUnmounted ? r(m) : s(m, h, g);
        }, X = () => {
          const z = m._isLeaving || !!m[Gn];
          m._isLeaving && m[Gn](
            !0
            /* cancelled */
          ), A.persisted && !z ? q() : I(m, () => {
            q(), F && F();
          });
        };
        D ? D(m, q, X) : X();
      }
    else
      s(m, h, g);
  }, $e = (f, h, g, S = !1, w = !1) => {
    const {
      type: m,
      props: R,
      ref: A,
      children: x,
      dynamicChildren: _,
      shapeFlag: L,
      patchFlag: I,
      dirs: D,
      cacheIndex: F,
      memo: q
    } = f;
    if (I === -2 && (w = !1), A != null && (ot(), Qt(A, null, g, f, !0), lt()), F != null && (h.renderCache[F] = void 0), L & 256) {
      h.ctx.deactivate(f);
      return;
    }
    const X = L & 1 && D, z = !kt(f);
    let oe;
    if (z && (oe = R && R.onVnodeBeforeUnmount) && He(oe, h, f), L & 6)
      N(f.component, g, S);
    else {
      if (L & 128) {
        f.suspense.unmount(g, S);
        return;
      }
      X && yt(f, null, h, "beforeUnmount"), L & 64 ? f.type.remove(
        f,
        h,
        g,
        Ft,
        S
      ) : _ && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !_.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (m !== ee || I > 0 && I & 64) ? _e(
        _,
        h,
        g,
        !1,
        !0
      ) : (m === ee && I & 384 || !w && L & 16) && _e(x, h, g), S && U(f);
    }
    const ue = q != null && F == null;
    (z && (oe = R && R.onVnodeUnmounted) || X || ue) && we(() => {
      oe && He(oe, h, f), X && yt(f, null, h, "unmounted"), ue && (f.el = null);
    }, g);
  }, U = (f) => {
    const { type: h, el: g, anchor: S, transition: w } = f;
    if (h === ee) {
      T(g, S);
      return;
    }
    if (h === Qn) {
      y(f);
      return;
    }
    const m = () => {
      r(g), w && !w.persisted && w.afterLeave && w.afterLeave();
    };
    if (f.shapeFlag & 1 && w && !w.persisted) {
      const { leave: R, delayLeave: A } = w, x = () => R(g, m);
      A ? A(f.el, m, x) : x();
    } else
      m();
  }, T = (f, h) => {
    let g;
    for (; f !== h; )
      g = v(f), r(f), f = g;
    r(h);
  }, N = (f, h, g) => {
    const { bum: S, scope: w, job: m, subTree: R, um: A, m: x, a: _ } = f;
    nr(x), nr(_), S && bn(S), w.stop(), m && (m.flags |= 8, $e(R, f, h, g)), A && we(A, h), we(() => {
      f.isUnmounted = !0;
    }, h);
  }, _e = (f, h, g, S = !1, w = !1, m = 0) => {
    for (let R = m; R < f.length; R++)
      $e(f[R], h, g, S, w);
  }, Qe = (f) => {
    if (f.shapeFlag & 6)
      return Qe(f.component.subTree);
    if (f.shapeFlag & 128)
      return f.suspense.next();
    const h = v(f.anchor || f.el), g = h && h[To];
    return g ? v(g) : h;
  };
  let Bn = !1;
  const Ds = (f, h, g) => {
    let S;
    f == null ? h._vnode && ($e(h._vnode, null, null, !0), S = h._vnode.component) : P(
      h._vnode || null,
      f,
      h,
      null,
      null,
      null,
      g
    ), h._vnode = f, Bn || (Bn = !0, Ks(S), zr(), Bn = !1);
  }, Ft = {
    p: P,
    um: $e,
    m: ze,
    r: U,
    mt: dt,
    mc: me,
    pc: J,
    pbc: Me,
    n: Qe,
    o: e
  };
  return {
    render: Ds,
    hydrate: void 0,
    createApp: Go(Ds)
  };
}
function zn({ type: e, props: t }, n) {
  return n === "svg" && e === "foreignObject" || n === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : n;
}
function mt({ effect: e, job: t }, n) {
  n ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function cl(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function _i(e, t, n = !1) {
  const s = e.children, r = t.children;
  if (Y(s) && Y(r))
    for (let i = 0; i < s.length; i++) {
      const l = s[i];
      let a = r[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = r[i] = et(r[i]), a.el = l.el), !n && a.patchFlag !== -2 && _i(l, a)), a.type === Vn && (a.patchFlag === -1 && (a = r[i] = et(a)), a.el = l.el), a.type === ut && !a.el && (a.el = l.el);
    }
}
function fl(e) {
  const t = e.slice(), n = [0];
  let s, r, i, l, a;
  const o = e.length;
  for (s = 0; s < o; s++) {
    const u = e[s];
    if (u !== 0) {
      if (r = n[n.length - 1], e[r] < u) {
        t[s] = r, n.push(s);
        continue;
      }
      for (i = 0, l = n.length - 1; i < l; )
        a = i + l >> 1, e[n[a]] < u ? i = a + 1 : l = a;
      u < e[n[i]] && (i > 0 && (t[s] = n[i - 1]), n[i] = s);
    }
  }
  for (i = n.length, l = n[i - 1]; i-- > 0; )
    n[i] = l, l = t[l];
  return n;
}
function wi(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : wi(t);
}
function nr(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Si(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Si(t.subTree) : null;
}
const Ci = (e) => e.__isSuspense;
function dl(e, t) {
  t && t.pendingBranch ? Y(e) ? t.effects.push(...e) : t.effects.push(e) : Co(e);
}
const ee = /* @__PURE__ */ Symbol.for("v-fgt"), Vn = /* @__PURE__ */ Symbol.for("v-txt"), ut = /* @__PURE__ */ Symbol.for("v-cmt"), Qn = /* @__PURE__ */ Symbol.for("v-stc"), rt = [];
let Ae = null;
function E(e = !1) {
  rt.push(Ae = e ? null : []);
}
function $s() {
  rt.pop(), Ae = rt[rt.length - 1] || null;
}
let rn = 1;
function sr(e, t = !1) {
  rn += e, e < 0 && Ae && t && (Ae.hasOnce = !0);
}
function xi(e) {
  return e.dynamicChildren = rn > 0 ? Ae || It : null, $s(), rn > 0 && Ae && Ae.push(e), e;
}
function O(e, t, n, s, r, i) {
  return xi(
    d(
      e,
      t,
      n,
      s,
      r,
      i,
      !0
    )
  );
}
function Ee(e, t, n, s, r) {
  return xi(
    le(
      e,
      t,
      n,
      s,
      r,
      !0
    )
  );
}
function Is(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function jt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const Ei = ({ key: e }) => e ?? null, yn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? re(e) || /* @__PURE__ */ ge(e) || H(e) ? { i: pe, r: e, k: t, f: !!n } : e : null);
function d(e, t = null, n = null, s = 0, r = null, i = e === ee ? 0 : 1, l = !1, a = !1) {
  const o = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Ei(t),
    ref: t && yn(t),
    scopeId: Xr,
    slotScopeIds: null,
    children: n,
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
    patchFlag: s,
    dynamicProps: r,
    dynamicChildren: null,
    appContext: null,
    ctx: pe
  };
  return a ? (xn(o, n), i & 128 && e.normalize(o)) : n && (o.shapeFlag |= re(n) ? 8 : 16), rn > 0 && // avoid a block node from tracking itself
  !l && // has current parent block
  Ae && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (o.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  o.patchFlag !== 32 && Ae.push(o), o;
}
const le = hl;
function hl(e, t = null, n = null, s = 0, r = null, i = !1) {
  if ((!e || e === Vo) && (e = ut), Is(e)) {
    const a = Dt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && xn(a, n), rn > 0 && !i && Ae && (a.shapeFlag & 6 ? Ae[Ae.indexOf(e)] = a : Ae.push(a)), a.patchFlag = -2, a;
  }
  if (Cl(e) && (e = e.__vccOpts), t) {
    t = pl(t);
    let { class: a, style: o } = t;
    a && !re(a) && (t.class = Et(a)), Q(o) && (/* @__PURE__ */ xs(o) && !Y(o) && (o = ie({}, o)), t.style = gs(o));
  }
  const l = re(e) ? 1 : Ci(e) ? 128 : $o(e) ? 64 : Q(e) ? 4 : H(e) ? 2 : 0;
  return d(
    e,
    t,
    n,
    s,
    r,
    l,
    i,
    !0
  );
}
function pl(e) {
  return e ? /* @__PURE__ */ xs(e) || pi(e) ? ie({}, e) : e : null;
}
function Dt(e, t, n = !1, s = !1) {
  const { props: r, ref: i, patchFlag: l, children: a, transition: o } = e, u = t ? gl(r || {}, t) : r, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: u,
    key: u && Ei(u),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      n && i ? Y(i) ? i.concat(yn(t)) : [i, yn(t)] : yn(t)
    ) : i,
    scopeId: e.scopeId,
    slotScopeIds: e.slotScopeIds,
    children: a,
    target: e.target,
    targetStart: e.targetStart,
    targetAnchor: e.targetAnchor,
    staticCount: e.staticCount,
    shapeFlag: e.shapeFlag,
    // if the vnode is cloned with extra props, we can no longer assume its
    // existing patch flag to be reliable and need to add the FULL_PROPS flag.
    // note: preserve flag for fragments since they use the flag for children
    // fast paths only.
    patchFlag: t && e.type !== ee ? l === -1 ? 16 : l | 16 : l,
    dynamicProps: e.dynamicProps,
    dynamicChildren: e.dynamicChildren,
    appContext: e.appContext,
    dirs: e.dirs,
    transition: o,
    // These should technically only be non-null on mounted VNodes. However,
    // they *should* be copied for kept-alive vnodes. So we just always copy
    // them since them being non-null during a mount doesn't affect the logic as
    // they will simply be overwritten.
    component: e.component,
    suspense: e.suspense,
    ssContent: e.ssContent && Dt(e.ssContent),
    ssFallback: e.ssFallback && Dt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return o && s && As(
    c,
    o.clone(c)
  ), c;
}
function fe(e = " ", t = 0) {
  return le(Vn, null, e, t);
}
function te(e = "", t = !1) {
  return t ? (E(), Ee(ut, null, e)) : le(ut, null, e);
}
function qe(e) {
  return e == null || typeof e == "boolean" ? le(ut) : Y(e) ? le(
    ee,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Is(e) ? et(e) : le(Vn, null, String(e));
}
function et(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Dt(e);
}
function xn(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (Y(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), xn(e, r()), r._c && (r._d = !0));
      return;
    } else {
      n = 32;
      const r = t._;
      !r && !pi(t) ? t._ctx = pe : r === 3 && pe && (pe.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (H(t)) {
    if (s & 65) {
      xn(e, { default: t });
      return;
    }
    t = { default: t, _ctx: pe }, n = 32;
  } else
    t = String(t), s & 64 ? (n = 16, t = [fe(t)]) : n = 8;
  e.children = t, e.shapeFlag |= n;
}
function gl(...e) {
  const t = {};
  for (let n = 0; n < e.length; n++) {
    const s = e[n];
    for (const r in s)
      if (r === "class")
        t.class !== s.class && (t.class = Et([t.class, s.class]));
      else if (r === "style")
        t.style = gs([t.style, s.style]);
      else if ($n(r)) {
        const i = t[r], l = s[r];
        l && i !== l && !(Y(i) && i.includes(l)) ? t[r] = i ? [].concat(i, l) : l : l == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !In(r) && (t[r] = l);
      } else r !== "" && (t[r] = s[r]);
  }
  return t;
}
function He(e, t, n, s = null) {
  Le(e, t, 7, [
    n,
    s
  ]);
}
const bl = ui();
let vl = 0;
function yl(e, t, n) {
  const s = e.type, r = (t ? t.appContext : e.appContext) || bl, i = {
    uid: vl++,
    vnode: e,
    type: s,
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
    scope: new qi(
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
    propsOptions: bi(s, r),
    emitsOptions: ci(s, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: Z,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: Z,
    data: Z,
    props: Z,
    attrs: Z,
    slots: Z,
    refs: Z,
    setupState: Z,
    setupContext: null,
    // suspense related
    suspense: n,
    suspenseId: n ? n.pendingId : 0,
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = zo.bind(null, i), e.ce && e.ce(i), i;
}
let ye = null;
const Ai = () => ye || pe;
let En, us;
{
  const e = Mn(), t = (n, s) => {
    let r;
    return (r = e[n]) || (r = e[n] = []), r.push(s), (i) => {
      r.length > 1 ? r.forEach((l) => l(i)) : r[0](i);
    };
  };
  En = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => ye = n
  ), us = t(
    "__VUE_SSR_SETTERS__",
    (n) => on = n
  );
}
const fn = (e) => {
  const t = ye;
  return En(e), e.scope.on(), () => {
    e.scope.off(), En(t);
  };
}, rr = () => {
  ye && ye.scope.off(), En(null);
};
function Ri(e) {
  return e.vnode.shapeFlag & 4;
}
let on = !1;
function ml(e, t = !1, n = !1) {
  t && us(t);
  const { props: s, children: r } = e.vnode, i = Ri(e);
  nl(e, s, i, t), ol(e, r, n || t);
  const l = i ? _l(e, t) : void 0;
  return t && us(!1), l;
}
function _l(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Fo);
  const { setup: s } = n;
  if (s) {
    ot();
    const r = e.setupContext = s.length > 1 ? Sl(e) : null, i = fn(e), l = un(
      s,
      e,
      0,
      [
        e.props,
        r
      ]
    ), a = Er(l);
    if (lt(), i(), (a || e.sp) && !kt(e) && ni(e), a) {
      if (l.then(rr, rr), t)
        return l.then((o) => {
          ir(e, o);
        }).catch((o) => {
          Dn(o, e, 0);
        });
      e.asyncDep = l;
    } else
      ir(e, l);
  } else
    Ti(e);
}
function ir(e, t, n) {
  H(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : Q(t) && (e.setupState = Wr(t)), Ti(e);
}
function Ti(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || Ge);
  {
    const r = fn(e);
    ot();
    try {
      Bo(e);
    } finally {
      lt(), r();
    }
  }
}
const wl = {
  get(e, t) {
    return he(e, "get", ""), e[t];
  }
};
function Sl(e) {
  const t = (n) => {
    e.exposed = n || {};
  };
  return {
    attrs: new Proxy(e.attrs, wl),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Fn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Wr(ho(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Xt)
        return Xt[n](e);
    },
    has(t, n) {
      return n in t || n in Xt;
    }
  })) : e.proxy;
}
function Cl(e) {
  return H(e) && "__vccOpts" in e;
}
const Nt = (e, t) => /* @__PURE__ */ yo(e, t, on), xl = "3.5.40";
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let cs;
const or = typeof window < "u" && window.trustedTypes;
if (or)
  try {
    cs = /* @__PURE__ */ or.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const $i = cs ? (e) => cs.createHTML(e) : (e) => e, El = "http://www.w3.org/2000/svg", Al = "http://www.w3.org/1998/Math/MathML", Ze = typeof document < "u" ? document : null, lr = Ze && /* @__PURE__ */ Ze.createElement("template"), Rl = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const r = t === "svg" ? Ze.createElementNS(El, e) : t === "mathml" ? Ze.createElementNS(Al, e) : n ? Ze.createElement(e, { is: n }) : Ze.createElement(e);
    return e === "select" && s && s.multiple != null && r.setAttribute("multiple", s.multiple), r;
  },
  createText: (e) => Ze.createTextNode(e),
  createComment: (e) => Ze.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Ze.querySelector(e),
  setScopeId(e, t) {
    e.setAttribute(t, "");
  },
  // __UNSAFE__
  // Reason: innerHTML.
  // Static content here can only come from compiled templates.
  // As long as the user only uses trusted templates, this is safe.
  insertStaticContent(e, t, n, s, r, i) {
    const l = n ? n.previousSibling : t.lastChild;
    if (r && (r === i || r.nextSibling))
      for (; t.insertBefore(r.cloneNode(!0), n), !(r === i || !(r = r.nextSibling)); )
        ;
    else {
      lr.innerHTML = $i(
        s === "svg" ? `<svg>${e}</svg>` : s === "mathml" ? `<math>${e}</math>` : e
      );
      const a = lr.content;
      if (s === "svg" || s === "mathml") {
        const o = a.firstChild;
        for (; o.firstChild; )
          a.appendChild(o.firstChild);
        a.removeChild(o);
      }
      t.insertBefore(a, n);
    }
    return [
      // first
      l ? l.nextSibling : t.firstChild,
      // last
      n ? n.previousSibling : t.lastChild
    ];
  }
}, Tl = /* @__PURE__ */ Symbol("_vtc");
function $l(e, t, n) {
  const s = e[Tl];
  s && (t = (t ? [t, ...s] : [...s]).join(" ")), t == null ? e.removeAttribute("class") : n ? e.setAttribute("class", t) : e.className = t;
}
const An = /* @__PURE__ */ Symbol("_vod"), Ii = /* @__PURE__ */ Symbol("_vsh"), Il = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[An] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : Kt(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), Kt(e, !0), s.enter(e)) : s.leave(e, () => {
      Kt(e, !1);
    }) : Kt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    Kt(e, t);
  }
};
function Kt(e, t) {
  e.style.display = t ? e[An] : "none", e[Ii] = !t;
}
const Ol = /* @__PURE__ */ Symbol(""), Pl = /(?:^|;)\s*display\s*:/;
function kl(e, t, n) {
  const s = e.style, r = re(n);
  let i = !1;
  if (n && !r) {
    if (t)
      if (re(t))
        for (const l of t.split(";")) {
          const a = l.slice(0, l.indexOf(":")).trim();
          n[a] == null && Wt(s, a, "");
        }
      else
        for (const l in t)
          n[l] == null && Wt(s, l, "");
    for (const l in n) {
      l === "display" && (i = !0);
      const a = n[l];
      a != null ? Ul(
        e,
        l,
        !re(t) && t ? t[l] : void 0,
        a
      ) || Wt(s, l, a) : Wt(s, l, "");
    }
  } else if (r) {
    if (t !== n) {
      const l = s[Ol];
      l && (n += ";" + l), s.cssText = n, i = Pl.test(n);
    }
  } else t && e.removeAttribute("style");
  An in e && (e[An] = i ? s.display : "", e[Ii] && (s.display = "none"));
}
const ar = /\s*!important$/;
function Wt(e, t, n) {
  if (Y(n))
    n.forEach((s) => Wt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = Ml(e, t);
    ar.test(n) ? e.setProperty(
      Ie(s),
      n.replace(ar, ""),
      "important"
    ) : e[s] = n;
  }
}
const ur = ["Webkit", "Moz", "ms"], Xn = {};
function Ml(e, t) {
  const n = Xn[t];
  if (n)
    return n;
  let s = Ce(t);
  if (s !== "filter" && s in e)
    return Xn[t] = s;
  s = Rr(s);
  for (let r = 0; r < ur.length; r++) {
    const i = ur[r] + s;
    if (i in e)
      return Xn[t] = i;
  }
  return t;
}
function Ul(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && re(s) && n === s;
}
const cr = "http://www.w3.org/1999/xlink";
function fr(e, t, n, s, r, i = ji(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(cr, t.slice(6, t.length)) : e.setAttributeNS(cr, t, n) : n == null || i && !$r(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : De(n) ? String(n) : n
  );
}
function dr(e, t, n, s, r) {
  if (t === "innerHTML" || t === "textContent") {
    n != null && (e[t] = t === "innerHTML" ? $i(n) : n);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const a = i === "OPTION" ? e.getAttribute("value") || "" : e.value, o = n == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(n);
    (a !== o || !("_value" in e)) && (e.value = o), n == null && e.removeAttribute(t), e._value = n;
    return;
  }
  let l = !1;
  if (n === "" || n == null) {
    const a = typeof e[t];
    a === "boolean" ? n = $r(n) : n == null && a === "string" ? (n = "", l = !0) : a === "number" && (n = 0, l = !0);
  }
  try {
    e[t] = n;
  } catch {
  }
  l && e.removeAttribute(r || t);
}
function pt(e, t, n, s) {
  e.addEventListener(t, n, s);
}
function Dl(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const hr = /* @__PURE__ */ Symbol("_vei");
function Nl(e, t, n, s, r = null) {
  const i = e[hr] || (e[hr] = {}), l = i[t];
  if (s && l)
    l.value = s;
  else {
    const [a, o] = Vl(t);
    if (s) {
      const u = i[t] = Hl(
        s,
        r
      );
      pt(e, a, u, o);
    } else l && (Dl(e, a, l, o), i[t] = void 0);
  }
}
const Ll = /(Once|Passive|Capture)$/, Yl = /^on:?(?:Once|Passive|Capture)$/;
function Vl(e) {
  let t, n;
  for (; (n = e.match(Ll)) && !Yl.test(e); )
    t || (t = {}), e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : Ie(e.slice(2)), t];
}
let Zn = 0;
const Fl = /* @__PURE__ */ Promise.resolve(), Bl = () => Zn || (Fl.then(() => Zn = 0), Zn = Date.now());
function Hl(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    const r = n.value;
    if (Y(r)) {
      const i = s.stopImmediatePropagation;
      s.stopImmediatePropagation = () => {
        i.call(s), s._stopped = !0;
      };
      const l = r.slice(), a = [s];
      for (let o = 0; o < l.length && !s._stopped; o++) {
        const u = l[o];
        u && Le(
          u,
          t,
          5,
          a
        );
      }
    } else
      Le(
        r,
        t,
        5,
        [s]
      );
  };
  return n.value = e, n.attached = Bl(), n;
}
const pr = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, jl = (e, t, n, s, r, i) => {
  const l = r === "svg";
  t === "class" ? $l(e, s, l) : t === "style" ? kl(e, n, s) : $n(t) ? In(t) || Nl(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Kl(e, t, s, l)) ? (dr(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && fr(e, t, s, l, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (ql(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !re(s))) ? dr(e, Ce(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), fr(e, t, s, l));
};
function Kl(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && pr(t) && H(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return pr(t) && re(n) ? !1 : t in e;
}
function ql(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = Ce(t);
  return Array.isArray(n) ? n.some((r) => Ce(r) === s) : Object.keys(n).some((r) => Ce(r) === s);
}
const gr = {};
// @__NO_SIDE_EFFECTS__
function Wl(e, t, n) {
  let s = /* @__PURE__ */ Re(e, t);
  On(s) && (s = ie({}, s, t));
  class r extends Os {
    constructor(l) {
      super(s, l, n);
    }
  }
  return r.def = s, r;
}
const Gl = typeof HTMLElement < "u" ? HTMLElement : class {
};
class Os extends Gl {
  constructor(t, n = {}, s = wr) {
    super(), this._def = t, this._props = n, this._createApp = s, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && s !== wr ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
      ie({}, t.shadowRootOptions, {
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
      if (t instanceof Os) {
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
    this._connected = !1, cn(() => {
      this._connected || (this._ob && (this._ob.disconnect(), this._ob = null), this._app && this._app.unmount(), this._instance && (this._instance.ce = void 0), this._app = this._instance = null, this._teleportTargets && (this._teleportTargets.clear(), this._teleportTargets = void 0));
    });
  }
  _processMutations(t) {
    for (const n of t)
      this._setAttr(n.attributeName);
  }
  /**
   * resolve inner component definition (handle possible async component)
   */
  _resolveDef() {
    if (this._pendingResolve)
      return;
    for (let s = 0; s < this.attributes.length; s++)
      this._setAttr(this.attributes[s].name);
    this._ob = new MutationObserver(this._processMutations.bind(this)), this._ob.observe(this, { attributes: !0 });
    const t = (s, r = !1) => {
      this._resolved = !0, this._pendingResolve = void 0;
      const { props: i, styles: l } = s;
      let a;
      if (i && !Y(i))
        for (const o in i) {
          const u = i[o];
          (u === Number || u && u.type === Number) && (o in this._props && (this._props[o] = Fs(this._props[o])), (a || (a = /* @__PURE__ */ Object.create(null)))[Ce(o)] = !0);
        }
      this._numberProps = a, this._resolveProps(s), this.shadowRoot && this._applyStyles(l), this._mount(s);
    }, n = this._def.__asyncLoader;
    n ? this._pendingResolve = n().then((s) => {
      s.configureApp = this._def.configureApp, t(this._def = s, !0);
    }) : t(this._def);
  }
  _mount(t) {
    this._app = this._createApp(t), this._inheritParentContext(), t.configureApp && t.configureApp(this._app), this._app._ceVNode = this._createVNode(), this._app.mount(this._root);
    const n = this._instance && this._instance.exposed;
    if (n)
      for (const s in n)
        W(this, s) || Object.defineProperty(this, s, {
          // unwrap ref to be consistent with public instance behavior
          get: () => qr(n[s])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, s = Y(n) ? n : Object.keys(n || {});
    for (const r of Object.keys(this))
      r[0] !== "_" && s.includes(r) && this._setProp(r, this[r]);
    for (const r of s.map(Ce))
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
    const n = this.hasAttribute(t);
    let s = n ? this.getAttribute(t) : gr;
    const r = Ce(t);
    n && this._numberProps && this._numberProps[r] && (s = Fs(s)), this._setProp(r, s, !1, !0);
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
  _setProp(t, n, s = !0, r = !1) {
    if (n !== this._props[t] && (this._dirty = !0, n === gr ? delete this._props[t] : (this._props[t] = n, t === "key" && this._app && (this._app._ceVNode.key = n)), r && this._instance && this._update(), s)) {
      const i = this._ob;
      i && (this._processMutations(i.takeRecords()), i.disconnect()), n === !0 ? this.setAttribute(Ie(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(Ie(t), n + "") : n || this.removeAttribute(Ie(t)), i && i.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), Zl(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = le(this._def, ie(t, this._props));
    return this._instance || (n.ce = (s) => {
      this._instance = s, s.ce = this, s.isCE = !0;
      const r = (i, l) => {
        this.dispatchEvent(
          new CustomEvent(
            i,
            On(l[0]) ? ie({ detail: l }, l[0]) : { detail: l }
          )
        );
      };
      s.emit = (i, ...l) => {
        r(i, l), Ie(i) !== i && r(Ie(i), l);
      }, this._setParent();
    }), n;
  }
  _applyStyles(t, n, s) {
    if (!t) return;
    if (n) {
      if (n === this._def || this._styleChildren.has(n))
        return;
      this._styleChildren.add(n);
    }
    const r = this._nonce, i = this.shadowRoot, l = s ? this._getStyleAnchor(s) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i);
    let a = null;
    for (let o = t.length - 1; o >= 0; o--) {
      const u = document.createElement("style");
      r && u.setAttribute("nonce", r), u.textContent = t[o], i.insertBefore(u, a || l), a = u, o === 0 && (s || this._styleAnchors.set(this._def, u), n && this._styleAnchors.set(n, u));
    }
  }
  _getStyleAnchor(t) {
    if (!t)
      return null;
    const n = this._styleAnchors.get(t);
    return n && n.parentNode === this.shadowRoot ? n : (n && this._styleAnchors.delete(t), null);
  }
  _getRootStyleInsertionAnchor(t) {
    for (let n = 0; n < t.childNodes.length; n++) {
      const s = t.childNodes[n];
      if (!(s instanceof HTMLStyleElement))
        return s;
    }
    return null;
  }
  /**
   * Only called when shadowRoot is false
   */
  _parseSlots() {
    const t = this._slots = {};
    let n;
    for (; n = this.firstChild; ) {
      const s = n.nodeType === 1 && n.getAttribute("slot") || "default";
      (t[s] || (t[s] = [])).push(n), this.removeChild(n);
    }
  }
  /**
   * Only called when shadowRoot is false
   */
  _renderSlots() {
    const t = this._getSlots(), n = this._instance.type.__scopeId;
    for (let s = 0; s < t.length; s++) {
      const r = t[s], i = r.getAttribute("name") || "default", l = this._slots[i], a = r.parentNode;
      if (l)
        for (const o of l) {
          if (n && o.nodeType === 1) {
            const u = n + "-s", c = document.createTreeWalker(o, 1);
            o.setAttribute(u, "");
            let p;
            for (; p = c.nextNode(); )
              p.setAttribute(u, "");
          }
          a.insertBefore(o, r);
        }
      else
        for (; r.firstChild; ) a.insertBefore(r.firstChild, r);
      a.removeChild(r);
    }
  }
  /**
   * @internal
   */
  _getSlots() {
    const t = [this];
    this._teleportTargets && t.push(...this._teleportTargets);
    const n = /* @__PURE__ */ new Set();
    for (const s of t) {
      const r = s.querySelectorAll("slot");
      for (let i = 0; i < r.length; i++)
        n.add(r[i]);
    }
    return Array.from(n);
  }
  /**
   * @internal
   */
  _injectChildStyle(t, n) {
    this._applyStyles(t.styles, t, n);
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
const Lt = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return Y(t) ? (n) => bn(t, n) : t;
};
function Jl(e) {
  e.target.composing = !0;
}
function br(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const it = /* @__PURE__ */ Symbol("_assign");
function vr(e, t, n) {
  return t && (e = e.trim()), n && (e = kn(e)), e;
}
const zl = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, r) {
    e[it] = Lt(r);
    const i = s || r.props && r.props.type === "number";
    pt(e, t ? "change" : "input", (l) => {
      l.target.composing || e[it](vr(e.value, n, i));
    }), (n || i) && pt(e, "change", () => {
      e.value = vr(e.value, n, i);
    }), t || (pt(e, "compositionstart", Jl), pt(e, "compositionend", br), pt(e, "change", br));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: r, number: i } }, l) {
    if (e[it] = Lt(l), e.composing) return;
    const a = (i || e.type === "number") && !/^0\d/.test(e.value) ? kn(e.value) : e.value, o = t ?? "";
    if (a === o)
      return;
    const u = e.getRootNode();
    (u instanceof Document || u instanceof ShadowRoot) && u.activeElement === e && e.type !== "range" && (s && t === n || r && e.value.trim() === o) || (e.value = o);
  }
}, Rn = {
  // #4096 array checkboxes need to be deep traversed
  deep: !0,
  created(e, t, n) {
    e[it] = Lt(n), pt(e, "change", () => {
      const s = e._modelValue, r = ln(e), i = e.checked, l = e[it];
      if (Y(s)) {
        const a = bs(s, r), o = a !== -1;
        if (i && !o)
          l(s.concat(r));
        else if (!i && o) {
          const u = [...s];
          u.splice(a, 1), l(u);
        }
      } else if (Yt(s)) {
        const a = new Set(s);
        i ? a.add(r) : a.delete(r), l(a);
      } else
        l(Oi(e, i));
    });
  },
  // set initial checked on mount to wait for true-value/false-value
  mounted: yr,
  beforeUpdate(e, t, n) {
    e[it] = Lt(n), yr(e, t, n);
  }
};
function yr(e, { value: t, oldValue: n }, s) {
  e._modelValue = t;
  let r;
  if (Y(t))
    r = bs(t, s.props.value) > -1;
  else if (Yt(t))
    r = t.has(s.props.value);
  else {
    if (t === n) return;
    r = Vt(t, Oi(e, !0));
  }
  e.checked !== r && (e.checked = r);
}
const Ql = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    e._modelValue = t, pt(e, "change", () => {
      const r = Array.prototype.filter.call(e.options, (i) => i.selected).map(
        (i) => n ? kn(ln(i)) : ln(i)
      );
      e[it](
        e.multiple ? Yt(e._modelValue) ? new Set(r) : r : r[0]
      ), e._assigning = !0, cn(() => {
        e._assigning = !1;
      });
    }), e[it] = Lt(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    mr(e, t);
  },
  beforeUpdate(e, { value: t }, n) {
    e._modelValue = t, e[it] = Lt(n);
  },
  updated(e, { value: t }) {
    e._assigning || mr(e, t);
  }
};
function mr(e, t) {
  const n = e.multiple, s = Y(t);
  if (!(n && !s && !Yt(t))) {
    for (let r = 0, i = e.options.length; r < i; r++) {
      const l = e.options[r], a = ln(l);
      if (n)
        if (s) {
          const o = typeof a;
          o === "string" || o === "number" ? l.selected = t.some((u) => String(u) === String(a)) : l.selected = bs(t, a) > -1;
        } else
          l.selected = t.has(a);
      else if (Vt(ln(l), t)) {
        e.selectedIndex !== r && (e.selectedIndex = r);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function ln(e) {
  return "_value" in e ? e._value : e.value;
}
function Oi(e, t) {
  const n = t ? "_trueValue" : "_falseValue";
  return n in e ? e[n] : t;
}
const Xl = /* @__PURE__ */ ie({ patchProp: jl }, Rl);
let _r;
function Pi() {
  return _r || (_r = al(Xl));
}
const Zl = ((...e) => {
  Pi().render(...e);
}), wr = ((...e) => {
  const t = Pi().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const r = ta(s);
    if (!r) return;
    const i = t._component;
    !H(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const l = n(r, !1, ea(r));
    return r instanceof Element && (r.removeAttribute("v-cloak"), r.setAttribute("data-v-app", "")), l;
  }, t;
});
function ea(e) {
  if (e instanceof SVGElement)
    return "svg";
  if (typeof MathMLElement == "function" && e instanceof MathMLElement)
    return "mathml";
}
function ta(e) {
  return re(e) ? document.querySelector(e) : e;
}
const na = 8e3, sa = 2e3, Sr = 1e6, Se = "Unable to complete this request.", Cr = "Request timed out.", Zt = "Request cancelled.", ki = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Mi = `
  plugin { enabled bindMode customHost port authMode tailscaleServe tailscaleHostname logLevel updateChannel }
  services { service enabled baseUrl username hasPassword hasApiKey extra { key value } }
`, Ps = `
  config { ${Mi} }
  changed restarted rolledBack error
`, ra = `query YarrRuntime { yarrRuntime { ${ki} } }`, ia = `query YarrConfig { yarrConfig { ${Mi} } }`, oa = `mutation SaveYarrConfig($input: SaveYarrConfigInput!) {
  saveYarrConfig(input: $input) { ${Ps} }
}`, la = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${ki} }
}`, aa = `query YarrDiscoveredServices {
  yarrDiscoveredServices {
    discoveryId
    candidates { candidateId source serviceId confidence reasons baseUrl hasCredential }
    errors { code message }
  }
}`, ua = `query YarrLogs($lines: Int) {
  yarrLogs(lines: $lines) { lines truncated }
}`, ks = `
  installedVersion packagedVersion availableVersion updateAvailable usingOverlay rolledBack message
`, ca = `query YarrUpdateStatus { yarrUpdateStatus { ${ks} } }`, fa = `mutation PreviewYarrImport($input: PreviewYarrImportInput!) {
  previewYarrImport(input: $input) {
    previewId mappings { serviceId baseUrl hasUsername hasPassword hasApiKey } warnings
  }
}`, da = `mutation ApplyYarrImport($input: ApplyYarrImportInput!) {
  applyYarrImport(input: $input) { ${Ps} }
}`, ha = `mutation ApplyYarrDiscovery($input: ApplyYarrDiscoveryInput!) {
  applyYarrDiscovery(input: $input) { ${Ps} }
}`, pa = `mutation UpdateYarrBinary($version: String!) {
  updateYarrBinary(version: $version) { ${ks} }
}`, ga = `mutation ResetYarrBinary {
  resetYarrBinary { ${ks} }
}`;
function Ms(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function en(e) {
  return new DOMException(e, "AbortError");
}
async function ba(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw en(Zt);
    return;
  }
  await new Promise((t, n) => {
    const s = window.setInterval(() => {
      window.csrf_token && l(t);
    }, 20), r = window.setTimeout(() => l(t), sa), i = () => l(() => n(en(Zt))), l = (a) => {
      window.clearInterval(s), window.clearTimeout(r), e.removeEventListener("abort", i), a();
    };
    e.addEventListener("abort", i, { once: !0 });
  });
}
async function va(e) {
  const t = e.body;
  if (!t) throw new Error(Se);
  const n = e.headers.get("content-length");
  if (n && /^(?:0|[1-9]\d*)$/.test(n)) {
    const o = Number(n);
    if (Number.isSafeInteger(o) && o > Sr) {
      try {
        await t.cancel();
      } catch {
      }
      throw new Error(Se);
    }
  }
  const s = t.getReader(), r = [];
  let i = 0;
  try {
    for (; ; ) {
      const { done: o, value: u } = await s.read();
      if (o) break;
      if (i += u.byteLength, i > Sr) {
        try {
          await s.cancel();
        } catch {
        }
        throw new Error(Se);
      }
      r.push(u);
    }
  } catch (o) {
    throw o instanceof Error && o.message === Se ? o : new Error(Se);
  } finally {
    s.releaseLock();
  }
  const l = new Uint8Array(i);
  let a = 0;
  for (const o of r)
    l.set(o, a), a += o.byteLength;
  try {
    const o = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(l));
    if (!Ms(o)) throw new Error(Se);
    return o;
  } catch {
    throw new Error(Se);
  }
}
async function ya(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function Pe(e, t, n) {
  const s = new AbortController();
  let r = !1, i = !1;
  const l = window.setTimeout(() => {
    r = !0, s.abort(en(Cr));
  }, na), a = () => s.abort(en(Zt));
  n != null && n.aborted ? a() : n == null || n.addEventListener("abort", a, { once: !0 });
  try {
    if (await ba(s.signal), s.signal.aborted) throw en(Zt);
    const o = await fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": window.csrf_token ?? ""
      },
      body: JSON.stringify({ query: e, variables: t }),
      signal: s.signal
    });
    if (!o.ok)
      throw i = !0, await ya(o.body), s.abort(), new Error(Se);
    const u = await va(o);
    if (Array.isArray(u.errors) && u.errors.length > 0) throw new Error(Se);
    if (!Ms(u.data)) throw new Error(Se);
    return u.data;
  } catch (o) {
    throw r ? new Error(Cr) : i ? new Error(Se) : s.signal.aborted ? new Error(Zt) : o instanceof Error && o.message === Se ? o : new Error(Se);
  } finally {
    window.clearTimeout(l), n == null || n.removeEventListener("abort", a);
  }
}
function ke(e, t) {
  const n = e[t];
  if (!Ms(n)) throw new Error(Se);
  return n;
}
async function ma(e) {
  return ke(await Pe(ra, void 0, e), "yarrRuntime");
}
async function _a(e) {
  return ke(await Pe(ia, void 0, e), "yarrConfig");
}
async function wa(e, t) {
  return ke(
    await Pe(oa, { input: e }, t),
    "saveYarrConfig"
  );
}
async function Sa(e, t) {
  return ke(
    await Pe(la, { action: e }, t),
    "controlYarr"
  );
}
async function Ca(e) {
  return ke(
    await Pe(aa, void 0, e),
    "yarrDiscoveredServices"
  );
}
async function xa(e, t) {
  const n = Math.max(1, Math.min(500, Math.trunc(e)));
  return ke(
    await Pe(ua, { lines: n }, t),
    "yarrLogs"
  );
}
async function Ea(e) {
  return ke(
    await Pe(ca, void 0, e),
    "yarrUpdateStatus"
  );
}
async function Aa(e, t) {
  return ke(
    await Pe(fa, { input: { text: e } }, t),
    "previewYarrImport"
  );
}
async function Ra(e, t) {
  return ke(
    await Pe(da, { input: e }, t),
    "applyYarrImport"
  );
}
async function Ta(e, t) {
  return ke(
    await Pe(ha, { input: e }, t),
    "applyYarrDiscovery"
  );
}
async function $a(e, t) {
  return ke(
    await Pe(pa, { version: e }, t),
    "updateYarrBinary"
  );
}
async function Ia(e) {
  return ke(
    await Pe(ga, void 0, e),
    "resetYarrBinary"
  );
}
const Oa = {
  key: 0,
  class: "yarr-dialog-backdrop"
}, Pa = ["aria-busy"], ka = { class: "yarr-dialog__header" }, Ma = ["disabled"], Ua = { class: "yarr-dialog__body" }, Da = {
  key: 0,
  class: "yarr-dialog__footer"
}, Na = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", Us = /* @__PURE__ */ Re({
  __name: "AccessibleDialog",
  props: {
    open: { type: Boolean },
    title: {},
    busy: { type: Boolean, default: !1 }
  },
  emits: ["close"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ B(), i = `yarr-dialog-${ti()}`;
    let l = null;
    function a(b) {
      if (b.hasAttribute("disabled") || b.getAttribute("aria-disabled") === "true" || b.hidden || b.closest("[hidden]")) return !1;
      const C = window.getComputedStyle(b);
      return C.display !== "none" && C.visibility !== "hidden";
    }
    function o() {
      var b;
      return [...((b = r.value) == null ? void 0 : b.querySelectorAll(Na)) ?? []].filter(a);
    }
    function u() {
      var C;
      const b = (C = r.value) == null ? void 0 : C.querySelector("[data-autofocus]");
      return b && a(b) ? b : o()[0] ?? r.value;
    }
    function c(b) {
      var j, K;
      if (b.key === "Escape" && !n.busy) {
        b.preventDefault(), s("close");
        return;
      }
      if (b.key !== "Tab" || !n.open) return;
      const C = o();
      if (C.length === 0) {
        b.preventDefault(), (j = r.value) == null || j.focus();
        return;
      }
      const P = document.activeElement instanceof HTMLElement ? C.indexOf(document.activeElement) : -1;
      b.shiftKey && P <= 0 ? (b.preventDefault(), (K = C.at(-1)) == null || K.focus()) : !b.shiftKey && (P === -1 || P === C.length - 1) && (b.preventDefault(), C[0].focus());
    }
    function p(b) {
      var C;
      !n.open || !r.value || r.value.contains(b.target) || (C = u()) == null || C.focus();
    }
    function v() {
      document.removeEventListener("keydown", c), document.removeEventListener("focusin", p);
    }
    return Je(() => n.open, async (b) => {
      var C;
      if (v(), !b) {
        l == null || l.focus(), l = null;
        return;
      }
      l = document.activeElement instanceof HTMLElement ? document.activeElement : null, document.addEventListener("keydown", c), document.addEventListener("focusin", p), await cn(), (C = u()) == null || C.focus();
    }, { immediate: !0 }), At(() => {
      v(), l == null || l.focus();
    }), (b, C) => e.open ? (E(), O("div", Oa, [
      d("section", {
        ref_key: "panel",
        ref: r,
        class: "yarr-dialog",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": i,
        "aria-busy": e.busy,
        tabindex: "-1"
      }, [
        d("header", ka, [
          d("h2", { id: i }, M(e.title), 1),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            "aria-label": "Close dialog",
            onClick: C[0] || (C[0] = (P) => s("close"))
          }, "Close", 8, Ma)
        ]),
        d("div", Ua, [
          Gs(b.$slots, "default")
        ]),
        b.$slots.footer ? (E(), O("footer", Da, [
          Gs(b.$slots, "footer")
        ])) : te("", !0)
      ], 8, Pa)
    ])) : te("", !0);
  }
}), La = {
  key: 0,
  role: "status"
}, Ya = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, Va = ["disabled"], Fa = {
  key: 0,
  class: "yarr-warning-list"
}, Ba = {
  key: 1,
  class: "yarr-empty"
}, Ha = ["name", "value", "disabled"], ja = ["onUpdate:modelValue", "disabled"], Ka = ["disabled"], qa = ["disabled"], Wa = /* @__PURE__ */ Re({
  __name: "DiscoveryDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ B(), i = /* @__PURE__ */ B([]), l = /* @__PURE__ */ B({}), a = /* @__PURE__ */ B(!1), o = /* @__PURE__ */ B("");
    let u, c = 0;
    const p = Nt(() => i.value.length > 0 && !a.value);
    function v($) {
      return $ === "sabnzbd" ? "SABnzbd" : $ === "qbittorrent" ? "qBittorrent" : $.charAt(0).toUpperCase() + $.slice(1);
    }
    function b() {
      c += 1, u == null || u.abort(), r.value = void 0, i.value = [], l.value = {}, a.value = !1, o.value = "";
    }
    function C() {
      b(), s("close");
    }
    async function P() {
      u == null || u.abort(), u = new AbortController();
      const $ = ++c;
      a.value = !0, o.value = "";
      try {
        const k = await Ca(u.signal);
        $ === c && (r.value = k);
      } catch {
        $ === c && !u.signal.aborted && (o.value = "Docker discovery failed. Confirm the read-only Docker socket is available, then retry.");
      } finally {
        $ === c && (a.value = !1);
      }
    }
    async function j() {
      if (!r.value || i.value.length === 0) return;
      u == null || u.abort(), u = new AbortController(), a.value = !0, o.value = "";
      const $ = r.value.candidates.filter((y) => i.value.includes(y.candidateId)), k = [...new Set($.map((y) => y.serviceId))];
      try {
        const y = await Ta({
          discoveryId: r.value.discoveryId,
          selectedCandidateIds: [...i.value],
          credentialConsent: k.map((V) => ({ serviceId: V, consent: l.value[V] === !0 }))
        }, u.signal);
        b(), s("applied", y), s("close");
      } catch {
        u.signal.aborted || (o.value = "Discovery apply result was not confirmed. Refresh current configuration before retrying."), a.value = !1;
      }
    }
    function K($) {
      var k;
      return ((k = r.value) == null ? void 0 : k.candidates.some((y) => y.serviceId === $ && i.value.includes(y.candidateId))) === !0;
    }
    return Je(() => n.open, ($) => {
      $ ? (b(), P()) : b();
    }), Je(a, ($) => s("busy", $)), At(b), ($, k) => (E(), Ee(Us, {
      open: e.open,
      title: "Discover Docker services",
      busy: a.value,
      onClose: C
    }, {
      footer: xt(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: a.value,
          onClick: C
        }, "Cancel", 8, Ka),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: j
        }, M(a.value ? "Applying..." : "Apply selected"), 9, qa)
      ]),
      default: xt(() => [
        k[2] || (k[2] = d("p", null, "Yarr reads bounded container identity and endpoint metadata. Select each candidate explicitly.", -1)),
        a.value && !r.value ? (E(), O("p", La, "Inspecting Docker services...")) : te("", !0),
        o.value ? (E(), O("div", Ya, [
          d("p", null, M(o.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: a.value,
            onClick: P
          }, "Retry discovery", 8, Va)
        ])) : te("", !0),
        r.value ? (E(), O(ee, { key: 2 }, [
          r.value.errors.length ? (E(), O("ul", Fa, [
            (E(!0), O(ee, null, st(r.value.errors, (y) => (E(), O("li", {
              key: y.code
            }, [
              d("strong", null, M(y.code), 1),
              fe(": " + M(y.message), 1)
            ]))), 128))
          ])) : te("", !0),
          r.value.candidates.length === 0 ? (E(), O("p", Ba, "No supported Docker services were found.")) : te("", !0),
          (E(!0), O(ee, null, st(r.value.candidates, (y) => (E(), O("fieldset", {
            key: y.candidateId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              Ct(d("input", {
                "onUpdate:modelValue": k[0] || (k[0] = (V) => i.value = V),
                type: "checkbox",
                name: `discovery-candidate-${y.candidateId}`,
                value: y.candidateId,
                disabled: a.value
              }, null, 8, Ha), [
                [Rn, i.value]
              ]),
              k[1] || (k[1] = fe()),
              d("strong", null, M(v(y.serviceId)), 1)
            ]),
            d("span", null, M(y.baseUrl) + " · " + M(y.confidence) + "% confidence", 1),
            d("small", null, M(y.reasons.join("; ")), 1)
          ]))), 128)),
          (E(!0), O(ee, null, st([...new Set(r.value.candidates.filter((y) => y.hasCredential).map((y) => y.serviceId))], (y) => Ct((E(), O("label", {
            key: y,
            class: "yarr-consent-row"
          }, [
            Ct(d("input", {
              "onUpdate:modelValue": (V) => l.value[y] = V,
              type: "checkbox",
              disabled: a.value
            }, null, 8, ja), [
              [Rn, l.value[y]]
            ]),
            fe(" Import credentials for " + M(v(y)), 1)
          ])), [
            [Il, K(y)]
          ])), 128))
        ], 64)) : te("", !0)
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), Ga = {
  key: 0,
  class: "yarr-dialog-flow"
}, Ja = ["disabled"], za = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Qa = {
  key: 1,
  class: "yarr-dialog-flow"
}, Xa = {
  key: 0,
  class: "yarr-warning-list"
}, Za = ["name", "value", "disabled"], eu = { key: 0 }, tu = ["onUpdate:modelValue", "disabled"], nu = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, su = ["disabled"], ru = ["disabled"], iu = ["disabled"], ou = /* @__PURE__ */ Re({
  __name: "ImportDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ B(""), i = /* @__PURE__ */ B(), l = /* @__PURE__ */ B([]), a = /* @__PURE__ */ B({}), o = /* @__PURE__ */ B(!1), u = /* @__PURE__ */ B("");
    let c;
    const p = Nt(() => l.value.length > 0 && !o.value);
    function v() {
      c == null || c.abort(), r.value = "", i.value = void 0, l.value = [], a.value = {}, o.value = !1, u.value = "";
    }
    function b() {
      v(), s("close");
    }
    function C($) {
      return $ === "sabnzbd" ? "SABnzbd" : $ === "qbittorrent" ? "qBittorrent" : $.charAt(0).toUpperCase() + $.slice(1);
    }
    function P($) {
      return $.hasPassword || $.hasApiKey;
    }
    async function j() {
      if (r.value.trim() === "") {
        u.value = "Paste environment settings before requesting a preview.";
        return;
      }
      c == null || c.abort(), c = new AbortController(), o.value = !0, u.value = "";
      const $ = r.value;
      try {
        i.value = await Aa($, c.signal), r.value = "", l.value = [], a.value = {};
      } catch {
        c.signal.aborted || (u.value = "Import preview failed. Check the format and retry; no settings were applied.");
      } finally {
        o.value = !1;
      }
    }
    async function K() {
      if (!(!i.value || l.value.length === 0)) {
        c == null || c.abort(), c = new AbortController(), o.value = !0, u.value = "";
        try {
          const $ = await Ra({
            previewId: i.value.previewId,
            selectedServiceIds: [...l.value],
            credentialConsent: l.value.map((k) => ({ serviceId: k, consent: a.value[k] === !0 }))
          }, c.signal);
          v(), s("applied", $), s("close");
        } catch {
          c.signal.aborted || (u.value = "Import result was not confirmed. Refresh current configuration before retrying."), o.value = !1;
        }
      }
    }
    return Je(() => n.open, ($) => {
      $ ? v() : r.value = "";
    }), Je(o, ($) => s("busy", $)), At(v), ($, k) => (E(), Ee(Us, {
      open: e.open,
      title: "Import configuration",
      busy: o.value,
      onClose: b
    }, {
      footer: xt(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: o.value,
          onClick: b
        }, "Cancel", 8, su),
        i.value ? (E(), O("button", {
          key: 1,
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: K
        }, M(o.value ? "Applying..." : "Apply selected"), 9, iu)) : (E(), O("button", {
          key: 0,
          type: "button",
          class: "yarr-button",
          disabled: o.value || r.value.trim() === "",
          onClick: j
        }, M(o.value ? "Previewing..." : "Preview import"), 9, ru))
      ]),
      default: xt(() => [
        i.value ? (E(), O("div", Qa, [
          k[5] || (k[5] = d("p", null, "Select at least one service. Credential permission is separate for each selected service.", -1)),
          i.value.warnings.length ? (E(), O("ul", Xa, [
            (E(!0), O(ee, null, st(i.value.warnings, (y) => (E(), O("li", { key: y }, M(y), 1))), 128))
          ])) : te("", !0),
          (E(!0), O(ee, null, st(i.value.mappings, (y) => (E(), O("fieldset", {
            key: y.serviceId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              Ct(d("input", {
                "onUpdate:modelValue": k[1] || (k[1] = (V) => l.value = V),
                type: "checkbox",
                name: `import-service-${y.serviceId}`,
                value: y.serviceId,
                disabled: o.value
              }, null, 8, Za), [
                [Rn, l.value]
              ]),
              k[4] || (k[4] = fe()),
              d("strong", null, M(C(y.serviceId)), 1)
            ]),
            d("span", null, M(y.baseUrl ?? "No URL mapped"), 1),
            l.value.includes(y.serviceId) && P(y) ? (E(), O("label", eu, [
              Ct(d("input", {
                "onUpdate:modelValue": (V) => a.value[y.serviceId] = V,
                type: "checkbox",
                disabled: o.value
              }, null, 8, tu), [
                [Rn, a.value[y.serviceId]]
              ]),
              fe(" Import credentials for " + M(C(y.serviceId)), 1)
            ])) : te("", !0)
          ]))), 128)),
          u.value ? (E(), O("p", nu, M(u.value), 1)) : te("", !0)
        ])) : (E(), O("div", Ga, [
          k[3] || (k[3] = d("p", null, "Paste environment assignments. Yarr returns only mapped service metadata and warnings, never values.", -1)),
          d("label", null, [
            k[2] || (k[2] = fe("Paste environment settings", -1)),
            Ct(d("textarea", {
              "onUpdate:modelValue": k[0] || (k[0] = (y) => r.value = y),
              rows: "9",
              disabled: o.value,
              autocomplete: "off",
              spellcheck: "false"
            }, null, 8, Ja), [
              [zl, r.value]
            ])
          ]),
          u.value ? (E(), O("p", za, M(u.value), 1)) : te("", !0)
        ]))
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), lu = ["aria-busy"], au = { class: "yarr-section-heading" }, uu = { class: "yarr-actions" }, cu = ["disabled"], fu = ["disabled"], du = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, hu = ["disabled"], pu = {
  key: 1,
  role: "status"
}, gu = {
  key: 0,
  class: "yarr-note"
}, bu = {
  class: "yarr-log",
  "aria-label": "Yarr log output"
}, vu = /* @__PURE__ */ Re({
  __name: "LogsPanel",
  setup(e) {
    const t = /* @__PURE__ */ B(200), n = /* @__PURE__ */ B(), s = /* @__PURE__ */ B(!1), r = /* @__PURE__ */ B("");
    let i, l = 0;
    async function a() {
      i == null || i.abort(), i = new AbortController();
      const o = ++l;
      s.value = !0, r.value = "";
      try {
        const u = await xa(Math.max(1, Math.min(500, t.value)), i.signal);
        o === l && (n.value = u);
      } catch {
        o === l && !i.signal.aborted && (r.value = "Logs could not be loaded. Confirm Yarr is installed and retry.");
      } finally {
        o === l && (s.value = !1);
      }
    }
    return Ln(a), At(() => {
      l += 1, i == null || i.abort();
    }), (o, u) => (E(), O("section", {
      class: "yarr-panel",
      "aria-labelledby": "logs-heading",
      "aria-busy": s.value
    }, [
      d("div", au, [
        u[3] || (u[3] = d("div", null, [
          d("h2", { id: "logs-heading" }, "Logs"),
          d("p", null, "Read a bounded tail of the redacted Yarr log.")
        ], -1)),
        d("div", uu, [
          d("label", null, [
            u[2] || (u[2] = fe("Lines", -1)),
            Ct(d("select", {
              "onUpdate:modelValue": u[0] || (u[0] = (c) => t.value = c),
              disabled: s.value
            }, [...u[1] || (u[1] = [
              d("option", { value: 100 }, "100", -1),
              d("option", { value: 200 }, "200", -1),
              d("option", { value: 500 }, "500", -1)
            ])], 8, cu), [
              [
                Ql,
                t.value,
                void 0,
                { number: !0 }
              ]
            ])
          ]),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: s.value,
            onClick: a
          }, "Refresh logs", 8, fu)
        ])
      ]),
      r.value ? (E(), O("div", du, [
        d("p", null, M(r.value), 1),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: s.value,
          onClick: a
        }, "Retry log request", 8, hu)
      ])) : n.value ? (E(), O(ee, { key: 2 }, [
        n.value.truncated ? (E(), O("p", gu, "Older lines were omitted. Increase the bounded line count if needed.")) : te("", !0),
        d("pre", bu, [
          (E(!0), O(ee, null, st(n.value.lines, (c, p) => (E(), O("span", { key: p }, M(c) + M(`
`), 1))), 128))
        ])
      ], 64)) : (E(), O("p", pu, "Loading logs..."))
    ], 8, lu));
  }
}), yu = {
  class: "yarr-panel",
  "aria-labelledby": "overview-heading"
}, mu = { class: "yarr-section-heading" }, _u = { class: "yarr-actions" }, wu = ["disabled"], Su = ["disabled"], Cu = ["disabled"], xu = { class: "yarr-detail-list" }, Eu = { class: "yarr-operation-row" }, Au = { class: "yarr-actions" }, Ru = ["disabled"], Tu = ["disabled"], $u = /* @__PURE__ */ Re({
  __name: "OverviewPanel",
  props: {
    runtime: {},
    config: {},
    busy: { type: Boolean }
  },
  emits: ["control", "import", "discover"],
  setup(e, { emit: t }) {
    const n = t;
    return (s, r) => (E(), O("section", yu, [
      d("div", mu, [
        d("div", null, [
          r[5] || (r[5] = d("h2", { id: "overview-heading" }, "Current operation", -1)),
          d("p", null, M(e.runtime.healthMessage), 1)
        ]),
        d("div", _u, [
          e.runtime.state !== "running" ? (E(), O("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[0] || (r[0] = (i) => n("control", "START"))
          }, "Start Yarr", 8, wu)) : (E(), O("button", {
            key: 1,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[1] || (r[1] = (i) => n("control", "RESTART"))
          }, "Restart Yarr", 8, Su)),
          e.runtime.state === "running" ? (E(), O("button", {
            key: 2,
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[2] || (r[2] = (i) => n("control", "STOP"))
          }, "Stop Yarr", 8, Cu)) : te("", !0)
        ])
      ]),
      d("dl", xu, [
        d("div", null, [
          r[6] || (r[6] = d("dt", null, "Process ID", -1)),
          d("dd", null, M(e.runtime.pid ?? "Not running"), 1)
        ]),
        d("div", null, [
          r[7] || (r[7] = d("dt", null, "Uptime", -1)),
          d("dd", null, M(e.runtime.uptimeSeconds === null ? "Unavailable" : `${e.runtime.uptimeSeconds} seconds`), 1)
        ]),
        d("div", null, [
          r[8] || (r[8] = d("dt", null, "Enabled services", -1)),
          d("dd", null, M(e.config.services.filter((i) => i.service !== "yarr" && i.enabled).length), 1)
        ]),
        d("div", null, [
          r[9] || (r[9] = d("dt", null, "Tailscale Serve", -1)),
          d("dd", null, M(e.config.plugin.tailscaleServe ? e.config.plugin.tailscaleHostname : "Off"), 1)
        ])
      ]),
      d("div", Eu, [
        r[10] || (r[10] = d("div", null, [
          d("h3", null, "Bring in existing services"),
          d("p", null, "Preview environment settings or inspect Docker metadata before choosing what Yarr may apply.")
        ], -1)),
        d("div", Au, [
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[3] || (r[3] = (i) => n("import"))
          }, "Import configuration", 8, Ru),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[4] || (r[4] = (i) => n("discover"))
          }, "Discover Docker services", 8, Tu)
        ])
      ])
    ]));
  }
}), Iu = ["disabled"], Ou = ["disabled"], fs = /* @__PURE__ */ Re({
  __name: "ConfirmDialog",
  props: {
    open: { type: Boolean },
    title: {},
    description: {},
    confirmLabel: {},
    cancelLabel: { default: "Cancel" },
    busy: { type: Boolean, default: !1 },
    danger: { type: Boolean, default: !1 }
  },
  emits: ["close", "confirm"],
  setup(e, { emit: t }) {
    const n = t;
    return (s, r) => (E(), Ee(Us, {
      open: e.open,
      title: e.title,
      busy: e.busy,
      onClose: r[2] || (r[2] = (i) => n("close"))
    }, {
      footer: xt(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: e.busy,
          onClick: r[0] || (r[0] = (i) => n("close"))
        }, M(e.cancelLabel), 9, Iu),
        d("button", {
          type: "button",
          class: Et(["yarr-button", { "is-danger": e.danger }]),
          disabled: e.busy,
          onClick: r[1] || (r[1] = (i) => n("confirm"))
        }, M(e.busy ? "Working..." : e.confirmLabel), 11, Ou)
      ]),
      default: xt(() => [
        d("p", null, M(e.description), 1)
      ]),
      _: 1
    }, 8, ["open", "title", "busy"]));
  }
}), Pu = { class: "yarr-secret-field" }, ku = { class: "yarr-secret-field__status" }, Mu = ["name", "checked", "disabled"], Uu = ["name", "checked", "disabled"], Du = ["name", "aria-label", "disabled", "value"], Nu = {
  key: 2,
  class: "yarr-secret-field__pending",
  role: "status"
}, Lu = ["disabled"], Tn = /* @__PURE__ */ Re({
  __name: "SecretField",
  props: {
    name: {},
    label: {},
    configured: { type: Boolean },
    intent: { default: "PRESERVE" },
    disabled: { type: Boolean, default: !1 }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ B(n.intent), i = /* @__PURE__ */ B(""), l = /* @__PURE__ */ B(!1), a = `yarr-secret-${n.name}-${ti()}`;
    Je(() => n.intent, (p) => {
      r.value = p, p !== "SET" && (i.value = "");
    });
    function o(p) {
      if (r.value = p, p === "SET") {
        s("update", { kind: "SET", value: i.value });
        return;
      }
      i.value = "", s("update", { kind: p });
    }
    function u(p) {
      i.value = p, s("update", { kind: "SET", value: p });
    }
    function c() {
      l.value = !1, o("CLEAR");
    }
    return (p, v) => (E(), O(ee, null, [
      d("fieldset", Pu, [
        d("legend", null, M(e.label), 1),
        d("p", ku, M(e.configured ? "Configured" : "Not configured"), 1),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "PRESERVE",
            disabled: e.disabled,
            onChange: v[0] || (v[0] = (b) => o("PRESERVE"))
          }, null, 40, Mu),
          v[5] || (v[5] = fe(" Keep current value", -1))
        ]),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "SET",
            disabled: e.disabled,
            onChange: v[1] || (v[1] = (b) => o("SET"))
          }, null, 40, Uu),
          v[6] || (v[6] = fe(" Set a new value", -1))
        ]),
        r.value === "SET" ? (E(), O("label", {
          key: 0,
          for: a
        }, "New " + M(e.label), 1)) : te("", !0),
        r.value === "SET" ? (E(), O("input", {
          key: 1,
          id: a,
          name: `${e.name}-new-value`,
          type: "password",
          "aria-label": `New ${e.label}`,
          autocomplete: "new-password",
          disabled: e.disabled,
          placeholder: "Enter a new value",
          value: i.value,
          onInput: v[2] || (v[2] = (b) => u(b.target.value))
        }, null, 40, Du)) : te("", !0),
        r.value === "CLEAR" ? (E(), O("p", Nu, "This value will be cleared when changes are saved.")) : te("", !0),
        e.configured ? (E(), O("button", {
          key: 3,
          type: "button",
          class: "yarr-button is-danger is-quiet",
          disabled: e.disabled,
          onClick: v[3] || (v[3] = (b) => l.value = !0)
        }, "Clear " + M(e.label), 9, Lu)) : te("", !0)
      ]),
      le(fs, {
        open: l.value,
        title: `Clear ${e.label}?`,
        description: "Yarr may lose access until a replacement credential is saved.",
        "confirm-label": "Clear credential",
        "cancel-label": "Keep credential",
        busy: e.disabled,
        danger: "",
        onClose: v[4] || (v[4] = (b) => l.value = !1),
        onConfirm: c
      }, null, 8, ["open", "title", "busy"])
    ], 64));
  }
}), Yu = {
  class: "yarr-panel",
  "aria-labelledby": "server-heading"
}, Vu = { class: "yarr-form-rows" }, Fu = { class: "yarr-setting-row" }, Bu = ["checked", "disabled"], Hu = { class: "yarr-setting-row" }, ju = ["value", "disabled"], Ku = {
  key: 0,
  class: "yarr-setting-row"
}, qu = ["value", "disabled"], Wu = { class: "yarr-setting-row" }, Gu = ["value", "disabled"], Ju = { class: "yarr-setting-row" }, zu = ["value", "disabled"], Qu = { class: "yarr-auth-section" }, Xu = ["value", "disabled"], Zu = {
  key: 2,
  class: "yarr-form-grid"
}, ec = ["value", "disabled"], tc = ["value", "disabled"], nc = { class: "yarr-form-rows" }, sc = { class: "yarr-setting-row" }, rc = ["checked", "disabled"], ic = {
  key: 0,
  class: "yarr-setting-row"
}, oc = ["value", "disabled"], lc = { class: "yarr-setting-row" }, ac = ["value", "disabled"], uc = ["value"], cc = /* @__PURE__ */ Re({
  __name: "ServerAuthPanel",
  props: {
    plugin: {},
    auth: {},
    bearerConfigured: { type: Boolean },
    googleSecretConfigured: { type: Boolean },
    disabled: { type: Boolean }
  },
  emits: ["plugin", "auth"],
  setup(e, { emit: t }) {
    const n = e, s = t;
    function r(a) {
      s("plugin", { ...n.plugin, ...a });
    }
    function i(a) {
      s("auth", { ...n.auth, ...a });
    }
    function l(a, o) {
      i({ [a]: o });
    }
    return (a, o) => (E(), O("section", Yu, [
      o[26] || (o[26] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "server-heading" }, "Server & Auth"),
          d("p", null, "Keep Yarr on loopback unless authentication is fully configured.")
        ])
      ], -1)),
      d("div", Vu, [
        d("label", Fu, [
          o[13] || (o[13] = d("span", null, [
            d("strong", null, "Run Yarr"),
            d("small", null, "Start Yarr with the array lifecycle.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.enabled,
            disabled: e.disabled,
            onChange: o[0] || (o[0] = (u) => r({ enabled: u.target.checked }))
          }, null, 40, Bu)
        ]),
        d("label", Hu, [
          o[15] || (o[15] = d("span", null, [
            d("strong", null, "Bind mode"),
            d("small", null, "Choose which interfaces accept connections.")
          ], -1)),
          d("select", {
            value: e.plugin.bindMode,
            disabled: e.disabled,
            onChange: o[1] || (o[1] = (u) => r({ bindMode: u.target.value }))
          }, [...o[14] || (o[14] = [
            d("option", { value: "LOOPBACK" }, "Loopback only", -1),
            d("option", { value: "LAN" }, "LAN interfaces", -1),
            d("option", { value: "CUSTOM" }, "Custom address", -1)
          ])], 40, ju)
        ]),
        e.plugin.bindMode === "CUSTOM" ? (E(), O("label", Ku, [
          o[16] || (o[16] = d("span", null, [
            d("strong", null, "Custom bind address"),
            d("small", null, "Use an IP address owned by this server.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.customHost,
            disabled: e.disabled,
            onInput: o[2] || (o[2] = (u) => r({ customHost: u.target.value }))
          }, null, 40, qu)
        ])) : te("", !0),
        d("label", Wu, [
          o[17] || (o[17] = d("span", null, [
            d("strong", null, "Port"),
            d("small", null, "Yarr API and MCP listener port.")
          ], -1)),
          d("input", {
            type: "number",
            min: "1",
            max: "65535",
            value: e.plugin.port,
            disabled: e.disabled,
            onInput: o[3] || (o[3] = (u) => r({ port: Number(u.target.value) }))
          }, null, 40, Gu)
        ]),
        d("label", Ju, [
          o[19] || (o[19] = d("span", null, [
            d("strong", null, "Authentication mode"),
            d("small", null, "Required before exposing Yarr beyond loopback.")
          ], -1)),
          d("select", {
            value: e.plugin.authMode,
            disabled: e.disabled,
            onChange: o[4] || (o[4] = (u) => r({ authMode: u.target.value }))
          }, [...o[18] || (o[18] = [
            d("option", { value: "BEARER" }, "Bearer token", -1),
            d("option", { value: "GOOGLE_OAUTH" }, "Google OAuth", -1),
            d("option", { value: "TRUSTED_GATEWAY" }, "Trusted gateway", -1)
          ])], 40, zu)
        ])
      ]),
      d("div", Qu, [
        e.plugin.authMode === "BEARER" ? (E(), Ee(Tn, {
          key: 0,
          name: "bearer-token",
          label: "Bearer token",
          configured: e.bearerConfigured,
          intent: e.auth.bearerToken.kind,
          disabled: e.disabled,
          onUpdate: o[5] || (o[5] = (u) => l("bearerToken", u))
        }, null, 8, ["configured", "intent", "disabled"])) : e.plugin.authMode === "GOOGLE_OAUTH" ? (E(), O(ee, { key: 1 }, [
          d("label", null, [
            o[20] || (o[20] = fe("Google client ID", -1)),
            d("input", {
              type: "text",
              value: e.auth.googleClientId,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: o[6] || (o[6] = (u) => i({ googleClientId: u.target.value }))
            }, null, 40, Xu)
          ]),
          le(Tn, {
            name: "google-client-secret",
            label: "Google client secret",
            configured: e.googleSecretConfigured,
            intent: e.auth.googleClientSecret.kind,
            disabled: e.disabled,
            onUpdate: o[7] || (o[7] = (u) => l("googleClientSecret", u))
          }, null, 8, ["configured", "intent", "disabled"])
        ], 64)) : (E(), O("div", Zu, [
          d("label", null, [
            o[21] || (o[21] = fe("Trusted gateway hosts", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayHosts,
              disabled: e.disabled,
              rows: "3",
              onInput: o[8] || (o[8] = (u) => i({ trustedGatewayHosts: u.target.value }))
            }, null, 40, ec)
          ]),
          d("label", null, [
            o[22] || (o[22] = fe("Trusted gateway origins", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayOrigins,
              disabled: e.disabled,
              rows: "3",
              onInput: o[9] || (o[9] = (u) => i({ trustedGatewayOrigins: u.target.value }))
            }, null, 40, tc)
          ])
        ]))
      ]),
      d("div", nc, [
        d("label", sc, [
          o[23] || (o[23] = d("span", null, [
            d("strong", null, "Tailscale Serve"),
            d("small", null, "Publish the loopback endpoint through Tailscale.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.tailscaleServe,
            disabled: e.disabled,
            onChange: o[10] || (o[10] = (u) => r({ tailscaleServe: u.target.checked }))
          }, null, 40, rc)
        ]),
        e.plugin.tailscaleServe ? (E(), O("label", ic, [
          o[24] || (o[24] = d("span", null, [
            d("strong", null, "Tailscale hostname"),
            d("small", null, "DNS-label service name.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.tailscaleHostname,
            disabled: e.disabled,
            onInput: o[11] || (o[11] = (u) => r({ tailscaleHostname: u.target.value }))
          }, null, 40, oc)
        ])) : te("", !0),
        d("label", lc, [
          o[25] || (o[25] = d("span", null, [
            d("strong", null, "Log level"),
            d("small", null, "Increase verbosity only while diagnosing an issue.")
          ], -1)),
          d("select", {
            value: e.plugin.logLevel,
            disabled: e.disabled,
            onChange: o[12] || (o[12] = (u) => r({ logLevel: u.target.value }))
          }, [
            (E(), O(ee, null, st(["TRACE", "DEBUG", "INFO", "WARN", "ERROR"], (u) => d("option", {
              key: u,
              value: u
            }, M(u), 9, uc)), 64))
          ], 40, ac)
        ])
      ])
    ]));
  }
}), fc = {
  class: "yarr-panel",
  "aria-labelledby": "services-heading"
}, dc = {
  key: 0,
  class: "yarr-empty"
}, hc = ["aria-labelledby"], pc = { class: "yarr-service-row__identity" }, gc = ["id"], bc = { class: "yarr-switch" }, vc = ["checked", "disabled", "onChange"], yc = { class: "yarr-form-grid" }, mc = ["value", "disabled", "onInput"], _c = ["value", "disabled", "onInput"], wc = { class: "yarr-secret-grid" }, Sc = /* @__PURE__ */ Re({
  __name: "ServicesPanel",
  props: {
    services: {},
    disabled: { type: Boolean }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = {
      sonarr: "Sonarr",
      radarr: "Radarr",
      prowlarr: "Prowlarr",
      tautulli: "Tautulli",
      overseerr: "Overseerr",
      bazarr: "Bazarr",
      tracearr: "Tracearr",
      sabnzbd: "SABnzbd",
      qbittorrent: "qBittorrent",
      plex: "Plex",
      jellyfin: "Jellyfin"
    };
    function i(o) {
      return r[o] ?? o;
    }
    function l(o, u) {
      const c = n.services.map((p, v) => v === o ? { ...p, ...u } : p);
      s("update", c);
    }
    function a(o, u, c) {
      l(o, { [u]: c });
    }
    return (o, u) => (E(), O("section", fc, [
      u[1] || (u[1] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "services-heading" }, "Services"),
          d("p", null, "Enable only the integrations Yarr should contact.")
        ])
      ], -1)),
      e.services.length === 0 ? (E(), O("p", dc, "No service definitions are available.")) : te("", !0),
      (E(!0), O(ee, null, st(e.services, (c, p) => (E(), O("section", {
        key: c.service,
        class: "yarr-service-row",
        "aria-labelledby": `service-${c.service}`
      }, [
        d("div", pc, [
          d("h3", {
            id: `service-${c.service}`
          }, M(i(c.service)), 9, gc),
          d("label", bc, [
            d("input", {
              type: "checkbox",
              checked: c.enabled,
              disabled: e.disabled,
              onChange: (v) => l(p, { enabled: v.target.checked })
            }, null, 40, vc),
            u[0] || (u[0] = fe(" Enabled", -1))
          ])
        ]),
        d("div", yc, [
          d("label", null, [
            fe(M(i(c.service)) + " base URL", 1),
            d("input", {
              type: "url",
              value: c.baseUrl,
              disabled: e.disabled,
              onInput: (v) => l(p, { baseUrl: v.target.value })
            }, null, 40, mc)
          ]),
          d("label", null, [
            fe(M(i(c.service)) + " username", 1),
            d("input", {
              type: "text",
              value: c.username ?? "",
              disabled: e.disabled,
              autocomplete: "off",
              onInput: (v) => l(p, { username: v.target.value })
            }, null, 40, _c)
          ])
        ]),
        d("div", wc, [
          le(Tn, {
            name: `${c.service}-password`,
            label: `${i(c.service)} password`,
            configured: c.hasPassword,
            intent: c.password.kind,
            disabled: e.disabled,
            onUpdate: (v) => a(p, "password", v)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"]),
          le(Tn, {
            name: `${c.service}-api-key`,
            label: `${i(c.service)} API key`,
            configured: c.hasApiKey,
            intent: c.apiKey.kind,
            disabled: e.disabled,
            onUpdate: (v) => a(p, "apiKey", v)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"])
        ])
      ], 8, hc))), 128))
    ]));
  }
}), Cc = ["aria-label"], xc = {
  class: "yarr-status-badge__symbol",
  "aria-hidden": "true"
}, Ec = /* @__PURE__ */ Re({
  __name: "StatusBadge",
  props: {
    state: {},
    label: { default: void 0 }
  },
  setup(e) {
    const t = e, n = Nt(() => t.label ?? {
      success: "Available",
      warning: "Needs attention",
      danger: "Unavailable",
      neutral: "Unknown"
    }[t.state]);
    return (s, r) => (E(), O("span", {
      class: Et(["yarr-status-badge", `is-${e.state}`]),
      "aria-label": `Status: ${n.value}`
    }, [
      d("span", xc, M(e.state === "success" ? "OK" : e.state === "danger" ? "!" : "-"), 1),
      d("span", null, M(n.value), 1)
    ], 10, Cc));
  }
}), Ac = ["aria-busy"], Rc = { class: "yarr-section-heading" }, Tc = ["disabled"], $c = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Ic = ["disabled"], Oc = {
  key: 1,
  role: "status"
}, Pc = { class: "yarr-detail-list" }, kc = { key: 0 }, Mc = { class: "yarr-actions" }, Uc = ["disabled"], Dc = ["disabled"], Nc = /* @__PURE__ */ Re({
  __name: "UpdatesPanel",
  emits: ["busy"],
  setup(e, { emit: t }) {
    const n = t, s = /* @__PURE__ */ B(), r = /* @__PURE__ */ B(""), i = /* @__PURE__ */ B(!1), l = /* @__PURE__ */ B(!1), a = /* @__PURE__ */ B(!1);
    let o, u = 0;
    async function c() {
      o == null || o.abort(), o = new AbortController();
      const b = ++u;
      i.value = !0, r.value = "";
      try {
        const C = await Ea(o.signal);
        b === u && (s.value = C);
      } catch {
        b === u && !o.signal.aborted && (r.value = "Update status could not be loaded. Check Yarr connectivity, then retry.");
      } finally {
        b === u && (i.value = !1);
      }
    }
    async function p() {
      if (s.value) {
        o == null || o.abort(), o = new AbortController(), i.value = !0, r.value = "";
        try {
          s.value = await $a(s.value.availableVersion, o.signal), l.value = !1;
        } catch {
          o.signal.aborted || (r.value = "Update result was not confirmed. Refresh update status before retrying.");
        } finally {
          i.value = !1;
        }
      }
    }
    async function v() {
      o == null || o.abort(), o = new AbortController(), i.value = !0, r.value = "";
      try {
        s.value = await Ia(o.signal), a.value = !1;
      } catch {
        o.signal.aborted || (r.value = "Reset result was not confirmed. Refresh update status before retrying.");
      } finally {
        i.value = !1;
      }
    }
    return Ln(c), Je(i, (b) => n("busy", b)), At(() => {
      u += 1, o == null || o.abort(), n("busy", !1);
    }), (b, C) => {
      var P;
      return E(), O("section", {
        class: "yarr-panel",
        "aria-labelledby": "updates-heading",
        "aria-busy": i.value
      }, [
        d("div", Rc, [
          C[4] || (C[4] = d("div", null, [
            d("h2", { id: "updates-heading" }, "Updates"),
            d("p", null, "Install a verified release or return to the package version.")
          ], -1)),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: i.value,
            onClick: c
          }, "Check again", 8, Tc)
        ]),
        r.value ? (E(), O("div", $c, [
          d("p", null, M(r.value), 1),
          s.value ? te("", !0) : (E(), O("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: i.value,
            onClick: c
          }, "Retry update check", 8, Ic))
        ])) : te("", !0),
        !s.value && !r.value ? (E(), O("p", Oc, "Checking update status...")) : te("", !0),
        s.value ? (E(), O(ee, { key: 2 }, [
          d("dl", Pc, [
            d("div", null, [
              C[5] || (C[5] = d("dt", null, "Installed", -1)),
              d("dd", null, M(s.value.installedVersion), 1)
            ]),
            d("div", null, [
              C[6] || (C[6] = d("dt", null, "Packaged", -1)),
              d("dd", null, M(s.value.packagedVersion), 1)
            ]),
            d("div", null, [
              C[7] || (C[7] = d("dt", null, "Available", -1)),
              d("dd", null, M(s.value.availableVersion), 1)
            ]),
            d("div", null, [
              C[8] || (C[8] = d("dt", null, "Source", -1)),
              d("dd", null, M(s.value.usingOverlay ? "Update overlay" : "Plugin package"), 1)
            ])
          ]),
          d("p", {
            class: Et(["yarr-result", { "is-warning": s.value.rolledBack }]),
            role: "status"
          }, [
            fe(M(s.value.message), 1),
            s.value.rolledBack ? (E(), O("strong", kc, " The previous version was restored.")) : te("", !0)
          ], 2),
          d("div", Mc, [
            s.value.updateAvailable ? (E(), O("button", {
              key: 0,
              type: "button",
              class: "yarr-button",
              disabled: i.value,
              onClick: C[0] || (C[0] = (j) => l.value = !0)
            }, "Install " + M(s.value.availableVersion), 9, Uc)) : te("", !0),
            d("button", {
              type: "button",
              class: "yarr-button is-danger is-quiet",
              disabled: i.value,
              onClick: C[1] || (C[1] = (j) => a.value = !0)
            }, "Reset to packaged version", 8, Dc)
          ])
        ], 64)) : te("", !0),
        le(fs, {
          open: l.value,
          title: `Install Yarr ${(P = s.value) == null ? void 0 : P.availableVersion}?`,
          description: "Yarr will restart. If readiness fails, the updater will attempt to restore the previous binary.",
          "confirm-label": "Install update",
          busy: i.value,
          onClose: C[2] || (C[2] = (j) => l.value = !1),
          onConfirm: p
        }, null, 8, ["open", "title", "busy"]),
        le(fs, {
          open: a.value,
          title: "Reset to packaged Yarr?",
          description: "This removes the update overlay and restarts the binary shipped by the plugin package.",
          "confirm-label": "Reset Yarr",
          busy: i.value,
          danger: "",
          onClose: C[3] || (C[3] = (j) => a.value = !1),
          onConfirm: v
        }, null, 8, ["open", "busy"])
      ], 8, Ac);
    };
  }
}), Lc = ["aria-busy"], Yc = { class: "yarr-identity" }, Vc = { class: "yarr-workspace" }, Fc = {
  key: 0,
  class: "yarr-error yarr-load-error",
  role: "alert"
}, Bc = ["disabled"], Hc = {
  key: 1,
  class: "yarr-shell__message",
  role: "status"
}, jc = { class: "yarr-tabs-wrap" }, Kc = {
  class: "yarr-tabs",
  role: "tablist",
  "aria-label": "Yarr settings sections"
}, qc = ["id", "aria-selected", "aria-controls", "tabindex", "disabled", "onClick", "onKeydown"], Wc = ["id", "aria-labelledby"], Gc = { class: "yarr-save-bar" }, Jc = { "aria-live": "polite" }, zc = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Qc = {
  key: 1,
  class: "yarr-result",
  role: "status"
}, Xc = { key: 2 }, Zc = ["disabled"], ef = /* @__PURE__ */ Re({
  __name: "YarrSettings.ce",
  setup(e) {
    const t = ["Overview", "Services", "Server & Auth", "Updates", "Logs"], n = /* @__PURE__ */ B(), s = /* @__PURE__ */ B(), r = /* @__PURE__ */ B(), i = /* @__PURE__ */ B(), l = /* @__PURE__ */ B([]), a = /* @__PURE__ */ B(!1), o = /* @__PURE__ */ B(!1), u = /* @__PURE__ */ B("Overview"), c = /* @__PURE__ */ B(!0), p = /* @__PURE__ */ B(!1), v = /* @__PURE__ */ B(!1), b = /* @__PURE__ */ B(""), C = /* @__PURE__ */ B(""), P = /* @__PURE__ */ B(""), j = /* @__PURE__ */ B(!1), K = /* @__PURE__ */ B(!1), $ = /* @__PURE__ */ B(!1), k = /* @__PURE__ */ B([]);
    let y, V, de = 0;
    const Te = Nt(() => n.value && s.value && r.value && i.value), me = Nt(() => p.value || v.value);
    function gt(U, T) {
      var N;
      return ((N = U == null ? void 0 : U.extra.find((_e) => _e.key === T)) == null ? void 0 : N.value) ?? "";
    }
    function Me(U) {
      n.value = U, r.value = { ...U.plugin };
      const T = U.services.find((N) => N.service === "yarr");
      a.value = (T == null ? void 0 : T.hasApiKey) ?? !1, o.value = (T == null ? void 0 : T.hasPassword) ?? !1, i.value = {
        bearerToken: { kind: "PRESERVE" },
        googleClientId: (T == null ? void 0 : T.username) ?? "",
        googleClientSecret: { kind: "PRESERVE" },
        trustedGatewayHosts: gt(T, "YARR_MCP_ALLOWED_HOSTS"),
        trustedGatewayOrigins: gt(T, "YARR_MCP_ALLOWED_ORIGINS")
      }, l.value = U.services.filter((N) => N.service !== "yarr").map((N) => ({
        ...N,
        extra: N.extra.map((_e) => ({ ..._e })),
        password: { kind: "PRESERVE" },
        apiKey: { kind: "PRESERVE" }
      }));
    }
    async function ft() {
      y == null || y.abort(), y = new AbortController();
      const U = ++de;
      c.value = !0, $.value = !0, b.value = "", C.value = "";
      try {
        const [T, N] = await Promise.all([
          _a(y.signal),
          ma(y.signal)
        ]);
        if (U !== de) return;
        Me(T), s.value = N;
      } catch {
        U === de && !y.signal.aborted && (b.value = "Yarr settings could not be loaded. Confirm the Unraid API is running, then retry.");
      } finally {
        U === de && (c.value = !1, $.value = !1);
      }
    }
    function bt(U, T) {
      return T.kind === "CLEAR" ? !1 : T.kind === "SET" ? T.value.trim().length > 0 : U;
    }
    function Rt() {
      return !r.value || !i.value || r.value.bindMode === "LOOPBACK" ? "" : r.value.authMode === "BEARER" && !bt(a.value, i.value.bearerToken) ? "Bearer authentication requires a configured token before Yarr can bind beyond loopback." : r.value.authMode === "GOOGLE_OAUTH" && (i.value.googleClientId.trim() === "" || !bt(o.value, i.value.googleClientSecret)) ? "Google OAuth requires a client ID and configured client secret before Yarr can bind beyond loopback." : r.value.authMode === "TRUSTED_GATEWAY" && i.value.trustedGatewayHosts.trim() === "" && i.value.trustedGatewayOrigins.trim() === "" ? "Trusted gateway authentication requires at least one allowed host or origin before Yarr can bind beyond loopback." : "";
    }
    function dt(U) {
      return U.kind === "SET" && U.value.trim() === "" ? { kind: "PRESERVE" } : U;
    }
    function dn() {
      const U = r.value, T = i.value;
      return {
        ...U,
        bearerToken: dt(T.bearerToken),
        googleClientId: T.googleClientId,
        googleClientSecret: dt(T.googleClientSecret),
        trustedGatewayHosts: T.trustedGatewayHosts,
        trustedGatewayOrigins: T.trustedGatewayOrigins,
        services: l.value.map((N) => ({
          service: N.service,
          enabled: N.enabled,
          baseUrl: N.baseUrl,
          username: N.username ?? "",
          password: dt(N.password),
          apiKey: dt(N.apiKey)
        }))
      };
    }
    function ae(U) {
      return U.rolledBack ? `Changes were not kept. Previous configuration restored.${U.error ? ` ${U.error}` : ""}` : U.error ? `Save outcome is indeterminate. ${U.error} Check runtime status and logs before retrying.` : U.changed ? U.restarted ? "Changes saved and Yarr restarted." : "Changes saved. Yarr did not require a restart." : "No configuration changes were needed.";
    }
    async function se() {
      const U = Rt();
      if (U) {
        C.value = U;
        return;
      }
      V == null || V.abort(), V = new AbortController(), p.value = !0, C.value = "", P.value = "";
      try {
        const T = await wa(dn(), V.signal);
        Me(T.config), P.value = ae(T);
      } catch {
        V.signal.aborted || (C.value = "Save result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    async function J(U) {
      V == null || V.abort(), V = new AbortController(), p.value = !0, C.value = "";
      try {
        s.value = await Sa(U, V.signal), P.value = U === "STOP" ? "Yarr stopped." : U === "START" ? "Yarr started." : "Yarr restarted.";
      } catch {
        V.signal.aborted || (C.value = "Control result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    function Ye(U) {
      Me(U.config), P.value = ae(U);
    }
    function vt(U, T = !1) {
      u.value = U, T && cn(() => {
        var N;
        return (N = k.value[t.indexOf(U)]) == null ? void 0 : N.focus();
      });
    }
    function ze(U, T) {
      let N = T;
      if (U.key === "ArrowRight") N = (T + 1) % t.length;
      else if (U.key === "ArrowLeft") N = (T - 1 + t.length) % t.length;
      else if (U.key === "Home") N = 0;
      else if (U.key === "End") N = t.length - 1;
      else return;
      U.preventDefault(), vt(t[N], !0);
    }
    function $e(U, T) {
      U && (k.value[T] = U);
    }
    return Ln(ft), At(() => {
      de += 1, y == null || y.abort(), V == null || V.abort();
    }), (U, T) => (E(), O("section", {
      class: "yarr-shell yarr-settings",
      "aria-labelledby": "yarr-settings-title",
      "aria-busy": c.value || p.value
    }, [
      d("aside", Yc, [
        T[10] || (T[10] = d("p", { class: "yarr-shell__eyebrow" }, "Unraid service", -1)),
        T[11] || (T[11] = d("h1", { id: "yarr-settings-title" }, "Yarr", -1)),
        s.value ? (E(), Ee(Ec, {
          key: 0,
          state: s.value.ready ? "success" : s.value.state === "running" ? "warning" : "neutral",
          label: s.value.ready ? "Ready" : s.value.state
        }, null, 8, ["state", "label"])) : te("", !0),
        T[12] || (T[12] = d("p", null, "Media service operations", -1))
      ]),
      d("main", Vc, [
        b.value ? (E(), O("div", Fc, [
          d("p", null, M(b.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: c.value,
            onClick: ft
          }, "Retry", 8, Bc)
        ])) : Te.value ? (E(), O(ee, { key: 2 }, [
          d("ol", {
            class: Et(["yarr-signal-rail", { "is-refreshing": $.value }]),
            "aria-label": "Yarr lifecycle signals"
          }, [
            d("li", null, [
              T[13] || (T[13] = d("span", null, "Process", -1)),
              d("strong", null, M(s.value.state), 1)
            ]),
            d("li", null, [
              T[14] || (T[14] = d("span", null, "Ready", -1)),
              d("strong", null, M(s.value.ready ? "Yes" : "No"), 1)
            ]),
            d("li", null, [
              T[15] || (T[15] = d("span", null, "Endpoint", -1)),
              d("strong", null, M(s.value.bindAddress) + ":" + M(s.value.port), 1)
            ]),
            d("li", null, [
              T[16] || (T[16] = d("span", null, "Version", -1)),
              d("strong", null, M(s.value.version ?? "Unavailable"), 1)
            ])
          ], 2),
          d("div", jc, [
            d("div", Kc, [
              (E(), O(ee, null, st(t, (N, _e) => d("button", {
                id: `yarr-tab-${_e}`,
                key: N,
                ref_for: !0,
                ref: (Qe) => $e(Qe, _e),
                type: "button",
                role: "tab",
                "aria-selected": u.value === N,
                "aria-controls": `yarr-panel-${_e}`,
                tabindex: u.value === N ? 0 : -1,
                disabled: me.value,
                onClick: (Qe) => vt(N),
                onKeydown: (Qe) => ze(Qe, _e)
              }, M(N), 41, qc)), 64))
            ])
          ]),
          d("div", {
            id: `yarr-panel-${t.indexOf(u.value)}`,
            role: "tabpanel",
            "aria-labelledby": `yarr-tab-${t.indexOf(u.value)}`,
            tabindex: "0"
          }, [
            u.value === "Overview" ? (E(), Ee($u, {
              key: 0,
              runtime: s.value,
              config: n.value,
              busy: me.value,
              onControl: J,
              onImport: T[0] || (T[0] = (N) => j.value = !0),
              onDiscover: T[1] || (T[1] = (N) => K.value = !0)
            }, null, 8, ["runtime", "config", "busy"])) : u.value === "Services" ? (E(), Ee(Sc, {
              key: 1,
              services: l.value,
              disabled: me.value,
              onUpdate: T[2] || (T[2] = (N) => l.value = N)
            }, null, 8, ["services", "disabled"])) : u.value === "Server & Auth" ? (E(), Ee(cc, {
              key: 2,
              plugin: r.value,
              auth: i.value,
              "bearer-configured": a.value,
              "google-secret-configured": o.value,
              disabled: me.value,
              onPlugin: T[3] || (T[3] = (N) => r.value = N),
              onAuth: T[4] || (T[4] = (N) => i.value = N)
            }, null, 8, ["plugin", "auth", "bearer-configured", "google-secret-configured", "disabled"])) : u.value === "Updates" ? (E(), Ee(Nc, {
              key: 3,
              onBusy: T[5] || (T[5] = (N) => v.value = N)
            })) : (E(), Ee(vu, { key: 4 }))
          ], 8, Wc),
          d("div", Gc, [
            d("div", Jc, [
              C.value ? (E(), O("p", zc, M(C.value), 1)) : P.value ? (E(), O("p", Qc, M(P.value), 1)) : (E(), O("p", Xc, "Changes are validated again by the Yarr service before they are applied."))
            ]),
            d("button", {
              type: "button",
              class: "yarr-button",
              disabled: me.value,
              onClick: se
            }, M(p.value ? "Saving..." : "Save changes"), 9, Zc)
          ])
        ], 64)) : (E(), O("p", Hc, "Loading Yarr operations..."))
      ]),
      le(ou, {
        open: j.value,
        onClose: T[6] || (T[6] = (N) => j.value = !1),
        onApplied: Ye,
        onBusy: T[7] || (T[7] = (N) => v.value = N)
      }, null, 8, ["open"]),
      le(Wa, {
        open: K.value,
        onClose: T[8] || (T[8] = (N) => K.value = !1),
        onApplied: Ye,
        onBusy: T[9] || (T[9] = (N) => v.value = N)
      }, null, 8, ["open"])
    ], 8, Lc));
  }
}), tf = /* @__PURE__ */ Wl(ef, { shadowRoot: !1 });
customElements.get("yarr-settings-app") || customElements.define("yarr-settings-app", tf);
