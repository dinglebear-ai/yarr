/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function hn(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const s of e.split(",")) t[s] = 1;
  return (s) => s in t;
}
const ee = {}, It = [], Ge = () => {
}, Ar = () => !1, $s = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Is = (e) => e.startsWith("onUpdate:"), ie = Object.assign, pn = (e, t) => {
  const s = e.indexOf(t);
  s > -1 && e.splice(s, 1);
}, Ui = Object.prototype.hasOwnProperty, W = (e, t) => Ui.call(e, t), V = Array.isArray, Ot = (e) => ls(e) === "[object Map]", Yt = (e) => ls(e) === "[object Set]", Vn = (e) => ls(e) === "[object Date]", j = (e) => typeof e == "function", re = (e) => typeof e == "string", Le = (e) => typeof e == "symbol", X = (e) => e !== null && typeof e == "object", xr = (e) => (X(e) || j(e)) && j(e.then) && j(e.catch), Er = Object.prototype.toString, ls = (e) => Er.call(e), Li = (e) => ls(e).slice(8, -1), Os = (e) => ls(e) === "[object Object]", gn = (e) => re(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, Gt = /* @__PURE__ */ hn(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), ks = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((s) => t[s] || (t[s] = e(s)));
}, Di = /-\w/g, Ce = ks(
  (e) => e.replace(Di, (t) => t.slice(1).toUpperCase())
), Ni = /\B([A-Z])/g, ke = ks(
  (e) => e.replace(Ni, "-$1").toLowerCase()
), Rr = ks((e) => e.charAt(0).toUpperCase() + e.slice(1)), js = ks(
  (e) => e ? `on${Rr(e)}` : ""
), We = (e, t) => !Object.is(e, t), gs = (e, ...t) => {
  for (let s = 0; s < e.length; s++)
    e[s](...t);
}, Tr = (e, t, s, n = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: n,
    value: s
  });
}, Ps = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Bn = (e) => {
  const t = re(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Fn;
const Ms = () => Fn || (Fn = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : {});
function bn(e) {
  if (V(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++) {
      const n = e[s], r = re(n) ? Fi(n) : bn(n);
      if (r)
        for (const i in r)
          t[i] = r[i];
    }
    return t;
  } else if (re(e) || X(e))
    return e;
}
const Yi = /;(?![^(]*\))/g, Vi = /:([^]+)/, Bi = /\/\*[^]*?\*\//g;
function Fi(e) {
  const t = {};
  return e.replace(Bi, "").split(Yi).forEach((s) => {
    if (s) {
      const n = s.split(Vi);
      n.length > 1 && (t[n[0].trim()] = n[1].trim());
    }
  }), t;
}
function xt(e) {
  let t = "";
  if (re(e))
    t = e;
  else if (V(e))
    for (let s = 0; s < e.length; s++) {
      const n = xt(e[s]);
      n && (t += n + " ");
    }
  else if (X(e))
    for (const s in e)
      e[s] && (t += s + " ");
  return t.trim();
}
const Hi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ji = /* @__PURE__ */ hn(Hi);
function $r(e) {
  return !!e || e === "";
}
function Ki(e, t) {
  if (e.length !== t.length) return !1;
  let s = !0;
  for (let n = 0; s && n < e.length; n++)
    s = Vt(e[n], t[n]);
  return s;
}
function Vt(e, t) {
  if (e === t) return !0;
  let s = Vn(e), n = Vn(t);
  if (s || n)
    return s && n ? e.getTime() === t.getTime() : !1;
  if (s = Le(e), n = Le(t), s || n)
    return e === t;
  if (s = V(e), n = V(t), s || n)
    return s && n ? Ki(e, t) : !1;
  if (s = X(e), n = X(t), s || n) {
    if (!s || !n)
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
function vn(e, t) {
  return e.findIndex((s) => Vt(s, t));
}
const Ir = (e) => !!(e && e.__v_isRef === !0), M = (e) => re(e) ? e : e == null ? "" : V(e) || X(e) && (e.toString === Er || !j(e.toString)) ? Ir(e) ? M(e.value) : JSON.stringify(e, Or, 2) : String(e), Or = (e, t) => Ir(t) ? Or(e, t.value) : Ot(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (s, [n, r], i) => (s[Ks(n, i) + " =>"] = r, s),
    {}
  )
} : Yt(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((s) => Ks(s))
} : Le(t) ? Ks(t) : X(t) && !V(t) && !Os(t) ? String(t) : t, Ks = (e, t = "") => {
  var s;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Le(e) ? `Symbol(${(s = e.description) != null ? s : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let fe;
class qi {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && fe && (fe.active ? (this.parent = fe, this.index = (fe.scopes || (fe.scopes = [])).push(
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
      const s = fe;
      try {
        return fe = this, t();
      } finally {
        fe = s;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = fe, fe = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (fe === this)
        fe = this.prevScope;
      else {
        let t = fe;
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
function Wi() {
  return fe;
}
let se;
const qs = /* @__PURE__ */ new WeakSet();
class kr {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, fe && (fe.active ? fe.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, qs.has(this) && (qs.delete(this), this.trigger()));
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
    this.flags |= 2, Hn(this), Ur(this);
    const t = se, s = Ue;
    se = this, Ue = !0;
    try {
      return this.fn();
    } finally {
      Lr(this), se = t, Ue = s, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        _n(t);
      this.deps = this.depsTail = void 0, Hn(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? qs.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    tn(this) && this.run();
  }
  get dirty() {
    return tn(this);
  }
}
let Pr = 0, Jt, zt;
function Mr(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = zt, zt = e;
    return;
  }
  e.next = Jt, Jt = e;
}
function yn() {
  Pr++;
}
function mn() {
  if (--Pr > 0)
    return;
  if (zt) {
    let t = zt;
    for (zt = void 0; t; ) {
      const s = t.next;
      t.next = void 0, t.flags &= -9, t = s;
    }
  }
  let e;
  for (; Jt; ) {
    let t = Jt;
    for (Jt = void 0; t; ) {
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
function Ur(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Lr(e) {
  let t, s = e.depsTail, n = s;
  for (; n; ) {
    const r = n.prevDep;
    n.version === -1 ? (n === s && (s = r), _n(n), Gi(n)) : t = n, n.dep.activeLink = n.prevActiveLink, n.prevActiveLink = void 0, n = r;
  }
  e.deps = t, e.depsTail = s;
}
function tn(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Dr(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Dr(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === ts) || (e.globalVersion = ts, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !tn(e))))
    return;
  e.flags |= 2;
  const t = e.dep, s = se, n = Ue;
  se = e, Ue = !0;
  try {
    Ur(e);
    const r = e.fn(e._value);
    (t.version === 0 || We(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    se = s, Ue = n, Lr(e), e.flags &= -3;
  }
}
function _n(e, t = !1) {
  const { dep: s, prevSub: n, nextSub: r } = e;
  if (n && (n.nextSub = r, e.prevSub = void 0), r && (r.prevSub = n, e.nextSub = void 0), s.subs === e && (s.subs = n, !n && s.computed)) {
    s.computed.flags &= -5;
    for (let i = s.computed.deps; i; i = i.nextDep)
      _n(i, !0);
  }
  !t && !--s.sc && s.map && s.map.delete(s.key);
}
function Gi(e) {
  const { prevDep: t, nextDep: s } = e;
  t && (t.nextDep = s, e.prevDep = void 0), s && (s.prevDep = t, e.nextDep = void 0);
}
let Ue = !0;
const Nr = [];
function ot() {
  Nr.push(Ue), Ue = !1;
}
function lt() {
  const e = Nr.pop();
  Ue = e === void 0 ? !0 : e;
}
function Hn(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const s = se;
    se = void 0;
    try {
      t();
    } finally {
      se = s;
    }
  }
}
let ts = 0;
class Ji {
  constructor(t, s) {
    this.sub = t, this.dep = s, this.version = s.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class wn {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!se || !Ue || se === this.computed)
      return;
    let s = this.activeLink;
    if (s === void 0 || s.sub !== se)
      s = this.activeLink = new Ji(se, this), se.deps ? (s.prevDep = se.depsTail, se.depsTail.nextDep = s, se.depsTail = s) : se.deps = se.depsTail = s, Yr(s);
    else if (s.version === -1 && (s.version = this.version, s.nextDep)) {
      const n = s.nextDep;
      n.prevDep = s.prevDep, s.prevDep && (s.prevDep.nextDep = n), s.prevDep = se.depsTail, s.nextDep = void 0, se.depsTail.nextDep = s, se.depsTail = s, se.deps === s && (se.deps = n);
    }
    return s;
  }
  trigger(t) {
    this.version++, ts++, this.notify(t);
  }
  notify(t) {
    yn();
    try {
      for (let s = this.subs; s; s = s.prevSub)
        s.sub.notify() && s.sub.dep.notify();
    } finally {
      mn();
    }
  }
}
function Yr(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let n = t.deps; n; n = n.nextDep)
        Yr(n);
    }
    const s = e.dep.subs;
    s !== e && (e.prevSub = s, s && (s.nextSub = e)), e.dep.subs = e;
  }
}
const sn = /* @__PURE__ */ new WeakMap(), wt = /* @__PURE__ */ Symbol(
  ""
), nn = /* @__PURE__ */ Symbol(
  ""
), ss = /* @__PURE__ */ Symbol(
  ""
);
function pe(e, t, s) {
  if (Ue && se) {
    let n = sn.get(e);
    n || sn.set(e, n = /* @__PURE__ */ new Map());
    let r = n.get(s);
    r || (n.set(s, r = new wn()), r.map = n, r.key = s), r.track();
  }
}
function tt(e, t, s, n, r, i) {
  const l = sn.get(e);
  if (!l) {
    ts++;
    return;
  }
  const a = (o) => {
    o && o.trigger();
  };
  if (yn(), t === "clear")
    l.forEach(a);
  else {
    const o = V(e), u = o && gn(s);
    if (o && s === "length") {
      const c = Number(n);
      l.forEach((p, v) => {
        (v === "length" || v === ss || !Le(v) && v >= c) && a(p);
      });
    } else
      switch ((s !== void 0 || l.has(void 0)) && a(l.get(s)), u && a(l.get(ss)), t) {
        case "add":
          o ? u && a(l.get("length")) : (a(l.get(wt)), Ot(e) && a(l.get(nn)));
          break;
        case "delete":
          o || (a(l.get(wt)), Ot(e) && a(l.get(nn)));
          break;
        case "set":
          Ot(e) && a(l.get(wt));
          break;
      }
  }
  mn();
}
function Tt(e) {
  const t = /* @__PURE__ */ G(e);
  return t === e ? t : (pe(t, "iterate", ss), /* @__PURE__ */ Pe(e) ? t : t.map(De));
}
function Us(e) {
  return pe(e = /* @__PURE__ */ G(e), "iterate", ss), e;
}
function Ke(e, t) {
  return /* @__PURE__ */ at(e) ? Ut(/* @__PURE__ */ St(e) ? De(t) : t) : De(t);
}
const zi = {
  __proto__: null,
  [Symbol.iterator]() {
    return Ws(this, Symbol.iterator, (e) => Ke(this, e));
  },
  concat(...e) {
    return Tt(this).concat(
      ...e.map((t) => V(t) ? Tt(t) : t)
    );
  },
  entries() {
    return Ws(this, "entries", (e) => (e[1] = Ke(this, e[1]), e));
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
      (s) => s.map((n) => Ke(this, n)),
      arguments
    );
  },
  find(e, t) {
    return Xe(
      this,
      "find",
      e,
      t,
      (s) => Ke(this, s),
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
      (s) => Ke(this, s),
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
    return Gs(this, "includes", e);
  },
  indexOf(...e) {
    return Gs(this, "indexOf", e);
  },
  join(e) {
    return Tt(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return Gs(this, "lastIndexOf", e);
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
    return jn(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return jn(this, "reduceRight", e, t);
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
    return Ws(this, "values", (e) => Ke(this, e));
  }
};
function Ws(e, t, s) {
  const n = Us(e), r = n[t]();
  return n !== e && !/* @__PURE__ */ Pe(e) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.done || (i.value = s(i.value)), i;
  }), r;
}
const Qi = Array.prototype;
function Xe(e, t, s, n, r, i) {
  const l = Us(e), a = l !== e && !/* @__PURE__ */ Pe(e), o = l[t];
  if (o !== Qi[t]) {
    const p = o.apply(e, i);
    return a ? De(p) : p;
  }
  let u = s;
  l !== e && (a ? u = function(p, v) {
    return s.call(this, Ke(e, p), v, e);
  } : s.length > 2 && (u = function(p, v) {
    return s.call(this, p, v, e);
  }));
  const c = o.call(l, u, n);
  return a && r ? r(c) : c;
}
function jn(e, t, s, n) {
  const r = Us(e), i = r !== e && !/* @__PURE__ */ Pe(e);
  let l = s, a = !1;
  r !== e && (i ? (a = n.length === 0, l = function(u, c, p) {
    return a && (a = !1, u = Ke(e, u)), s.call(this, u, Ke(e, c), p, e);
  }) : s.length > 3 && (l = function(u, c, p) {
    return s.call(this, u, c, p, e);
  }));
  const o = r[t](l, ...n);
  return a ? Ke(e, o) : o;
}
function Gs(e, t, s) {
  const n = /* @__PURE__ */ G(e);
  pe(n, "iterate", ss);
  const r = n[t](...s);
  return (r === -1 || r === !1) && /* @__PURE__ */ xn(s[0]) ? (s[0] = /* @__PURE__ */ G(s[0]), n[t](...s)) : r;
}
function Ht(e, t, s = []) {
  ot(), yn();
  const n = (/* @__PURE__ */ G(e))[t].apply(e, s);
  return mn(), lt(), n;
}
const Xi = /* @__PURE__ */ hn("__proto__,__v_isRef,__isVue"), Vr = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Le)
);
function Zi(e) {
  Le(e) || (e = String(e));
  const t = /* @__PURE__ */ G(this);
  return pe(t, "has", e), t.hasOwnProperty(e);
}
class Br {
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
      return n === (r ? i ? uo : Kr : i ? jr : Hr).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(n) ? t : void 0;
    const l = V(t);
    if (!r) {
      let o;
      if (l && (o = zi[s]))
        return o;
      if (s === "hasOwnProperty")
        return Zi;
    }
    const a = Reflect.get(
      t,
      s,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ be(t) ? t : n
    );
    if ((Le(s) ? Vr.has(s) : Xi(s)) || (r || pe(t, "get", s), i))
      return a;
    if (/* @__PURE__ */ be(a)) {
      const o = l && gn(s) ? a : a.value;
      return r && X(o) ? /* @__PURE__ */ on(o) : o;
    }
    return X(a) ? r ? /* @__PURE__ */ on(a) : /* @__PURE__ */ Cn(a) : a;
  }
}
class Fr extends Br {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, s, n, r) {
    let i = t[s];
    const l = V(t) && gn(s);
    if (!this._isShallow) {
      const u = /* @__PURE__ */ at(i);
      if (!/* @__PURE__ */ Pe(n) && !/* @__PURE__ */ at(n) && (i = /* @__PURE__ */ G(i), n = /* @__PURE__ */ G(n)), !l && /* @__PURE__ */ be(i) && !/* @__PURE__ */ be(n))
        return u || (i.value = n), !0;
    }
    const a = l ? Number(s) < t.length : W(t, s), o = Reflect.set(
      t,
      s,
      n,
      /* @__PURE__ */ be(t) ? t : r
    );
    return t === /* @__PURE__ */ G(r) && o && (a ? We(n, i) && tt(t, "set", s, n) : tt(t, "add", s, n)), o;
  }
  deleteProperty(t, s) {
    const n = W(t, s);
    t[s];
    const r = Reflect.deleteProperty(t, s);
    return r && n && tt(t, "delete", s, void 0), r;
  }
  has(t, s) {
    const n = Reflect.has(t, s);
    return (!Le(s) || !Vr.has(s)) && pe(t, "has", s), n;
  }
  ownKeys(t) {
    return pe(
      t,
      "iterate",
      V(t) ? "length" : wt
    ), Reflect.ownKeys(t);
  }
}
class eo extends Br {
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
const to = /* @__PURE__ */ new Fr(), so = /* @__PURE__ */ new eo(), no = /* @__PURE__ */ new Fr(!0);
const rn = (e) => e, ds = (e) => Reflect.getPrototypeOf(e);
function ro(e, t, s) {
  return function(...n) {
    const r = this.__v_raw, i = /* @__PURE__ */ G(r), l = Ot(i), a = e === "entries" || e === Symbol.iterator && l, o = e === "keys" && l, u = r[e](...n), c = s ? rn : t ? Ut : De;
    return !t && pe(
      i,
      "iterate",
      o ? nn : wt
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
function hs(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function io(e, t) {
  const s = {
    get(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ G(i), a = /* @__PURE__ */ G(r);
      e || (We(r, a) && pe(l, "get", r), pe(l, "get", a));
      const { has: o } = ds(l), u = t ? rn : e ? Ut : De;
      if (o.call(l, r))
        return u(i.get(r));
      if (o.call(l, a))
        return u(i.get(a));
      i !== l && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && pe(/* @__PURE__ */ G(r), "iterate", wt), r.size;
    },
    has(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ G(i), a = /* @__PURE__ */ G(r);
      return e || (We(r, a) && pe(l, "has", r), pe(l, "has", a)), r === a ? i.has(r) : i.has(r) || i.has(a);
    },
    forEach(r, i) {
      const l = this, a = l.__v_raw, o = /* @__PURE__ */ G(a), u = t ? rn : e ? Ut : De;
      return !e && pe(o, "iterate", wt), a.forEach((c, p) => r.call(i, u(c), u(p), l));
    }
  };
  return ie(
    s,
    e ? {
      add: hs("add"),
      set: hs("set"),
      delete: hs("delete"),
      clear: hs("clear")
    } : {
      add(r) {
        const i = /* @__PURE__ */ G(this), l = ds(i), a = /* @__PURE__ */ G(r), o = !t && !/* @__PURE__ */ Pe(r) && !/* @__PURE__ */ at(r) ? a : r;
        return l.has.call(i, o) || We(r, o) && l.has.call(i, r) || We(a, o) && l.has.call(i, a) || (i.add(o), tt(i, "add", o, o)), this;
      },
      set(r, i) {
        !t && !/* @__PURE__ */ Pe(i) && !/* @__PURE__ */ at(i) && (i = /* @__PURE__ */ G(i));
        const l = /* @__PURE__ */ G(this), { has: a, get: o } = ds(l);
        let u = a.call(l, r);
        u || (r = /* @__PURE__ */ G(r), u = a.call(l, r));
        const c = o.call(l, r);
        return l.set(r, i), u ? We(i, c) && tt(l, "set", r, i) : tt(l, "add", r, i), this;
      },
      delete(r) {
        const i = /* @__PURE__ */ G(this), { has: l, get: a } = ds(i);
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
    s[r] = ro(r, e, t);
  }), s;
}
function Sn(e, t) {
  const s = io(e, t);
  return (n, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? n : Reflect.get(
    W(s, r) && r in n ? s : n,
    r,
    i
  );
}
const oo = {
  get: /* @__PURE__ */ Sn(!1, !1)
}, lo = {
  get: /* @__PURE__ */ Sn(!1, !0)
}, ao = {
  get: /* @__PURE__ */ Sn(!0, !1)
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
function Cn(e) {
  return /* @__PURE__ */ at(e) ? e : An(
    e,
    !1,
    to,
    oo,
    Hr
  );
}
// @__NO_SIDE_EFFECTS__
function fo(e) {
  return An(
    e,
    !1,
    no,
    lo,
    jr
  );
}
// @__NO_SIDE_EFFECTS__
function on(e) {
  return An(
    e,
    !0,
    so,
    ao,
    Kr
  );
}
function An(e, t, s, n, r) {
  if (!X(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const i = r.get(e);
  if (i)
    return i;
  const l = co(Li(e));
  if (l === 0)
    return e;
  const a = new Proxy(
    e,
    l === 2 ? n : s
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
function Pe(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function xn(e) {
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
const De = (e) => X(e) ? /* @__PURE__ */ Cn(e) : e, Ut = (e) => X(e) ? /* @__PURE__ */ on(e) : e;
// @__NO_SIDE_EFFECTS__
function be(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function H(e) {
  return po(e, !1);
}
function po(e, t) {
  return /* @__PURE__ */ be(e) ? e : new go(e, t);
}
class go {
  constructor(t, s) {
    this.dep = new wn(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = s ? t : /* @__PURE__ */ G(t), this._value = s ? t : De(t), this.__v_isShallow = s;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const s = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ Pe(t) || /* @__PURE__ */ at(t);
    t = n ? t : /* @__PURE__ */ G(t), We(t, s) && (this._rawValue = t, this._value = n ? t : De(t), this.dep.trigger());
  }
}
function qr(e) {
  return /* @__PURE__ */ be(e) ? e.value : e;
}
const bo = {
  get: (e, t, s) => t === "__v_raw" ? e : qr(Reflect.get(e, t, s)),
  set: (e, t, s, n) => {
    const r = e[t];
    return /* @__PURE__ */ be(r) && !/* @__PURE__ */ be(s) ? (r.value = s, !0) : Reflect.set(e, t, s, n);
  }
};
function Wr(e) {
  return /* @__PURE__ */ St(e) ? e : new Proxy(e, bo);
}
class vo {
  constructor(t, s, n) {
    this.fn = t, this.setter = s, this._value = void 0, this.dep = new wn(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = ts - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !s, this.isSSR = n;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    se !== this)
      return Mr(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return Dr(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function yo(e, t, s = !1) {
  let n, r;
  return j(e) ? n = e : (n = e.get, r = e.set), new vo(n, r, s);
}
const ps = {}, ms = /* @__PURE__ */ new WeakMap();
let _t;
function mo(e, t = !1, s = _t) {
  if (s) {
    let n = ms.get(s);
    n || ms.set(s, n = []), n.push(e);
  }
}
function _o(e, t, s = ee) {
  const { immediate: n, deep: r, once: i, scheduler: l, augmentJob: a, call: o } = s, u = (b) => r ? b : /* @__PURE__ */ Pe(b) || r === !1 || r === 0 ? st(b, 1) : st(b);
  let c, p, v, y, k = !1, O = !1;
  if (/* @__PURE__ */ be(e) ? (p = () => e.value, k = /* @__PURE__ */ Pe(e)) : /* @__PURE__ */ St(e) ? (p = () => u(e), k = !0) : V(e) ? (O = !0, k = e.some((b) => /* @__PURE__ */ St(b) || /* @__PURE__ */ Pe(b)), p = () => e.map((b) => {
    if (/* @__PURE__ */ be(b))
      return b.value;
    if (/* @__PURE__ */ St(b))
      return u(b);
    if (j(b))
      return o ? o(b, 2) : b();
  })) : j(e) ? t ? p = o ? () => o(e, 2) : e : p = () => {
    if (v) {
      ot();
      try {
        v();
      } finally {
        lt();
      }
    }
    const b = _t;
    _t = c;
    try {
      return o ? o(e, 3, [y]) : e(y);
    } finally {
      _t = b;
    }
  } : p = Ge, t && r) {
    const b = p, B = r === !0 ? 1 / 0 : r;
    p = () => st(b(), B);
  }
  const U = Wi(), K = () => {
    c.stop(), U && U.active && pn(U.effects, c);
  };
  if (i && t) {
    const b = t;
    t = (...B) => {
      const he = b(...B);
      return K(), he;
    };
  }
  let x = O ? new Array(e.length).fill(ps) : ps;
  const P = (b) => {
    if (!(!(c.flags & 1) || !c.dirty && !b))
      if (t) {
        const B = c.run();
        if (b || r || k || (O ? B.some((he, Ie) => We(he, x[Ie])) : We(B, x))) {
          v && v();
          const he = _t;
          _t = c;
          try {
            const Ie = [
              B,
              // pass undefined as the old value when it's changed for the first time
              x === ps ? void 0 : O && x[0] === ps ? [] : x,
              y
            ];
            x = B, o ? o(t, 3, Ie) : (
              // @ts-expect-error
              t(...Ie)
            );
          } finally {
            _t = he;
          }
        }
      } else
        c.run();
  };
  return a && a(P), c = new kr(p), c.scheduler = l ? () => l(P, !1) : P, y = (b) => mo(b, !1, c), v = c.onStop = () => {
    const b = ms.get(c);
    if (b) {
      if (o)
        o(b, 4);
      else
        for (const B of b) B();
      ms.delete(c);
    }
  }, t ? n ? P(!0) : x = c.run() : l ? l(P.bind(null, !0), !0) : c.run(), K.pause = c.pause.bind(c), K.resume = c.resume.bind(c), K.stop = K, K;
}
function st(e, t = 1 / 0, s) {
  if (t <= 0 || !X(e) || e.__v_skip || (s = s || /* @__PURE__ */ new Map(), (s.get(e) || 0) >= t))
    return e;
  if (s.set(e, t), t--, /* @__PURE__ */ be(e))
    st(e.value, t, s);
  else if (V(e))
    for (let n = 0; n < e.length; n++)
      st(e[n], t, s);
  else if (Yt(e) || Ot(e))
    e.forEach((n) => {
      st(n, t, s);
    });
  else if (Os(e)) {
    for (const n in e)
      st(e[n], t, s);
    for (const n of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, n) && st(e[n], t, s);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function as(e, t, s, n) {
  try {
    return n ? e(...n) : e();
  } catch (r) {
    Ls(r, t, s);
  }
}
function Ne(e, t, s, n) {
  if (j(e)) {
    const r = as(e, t, s, n);
    return r && xr(r) && r.catch((i) => {
      Ls(i, t, s);
    }), r;
  }
  if (V(e)) {
    const r = [];
    for (let i = 0; i < e.length; i++)
      r.push(Ne(e[i], t, s, n));
    return r;
  }
}
function Ls(e, t, s, n = !0) {
  const r = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: l } = t && t.appContext.config || ee;
  if (t) {
    let a = t.parent;
    const o = t.proxy, u = `https://vuejs.org/error-reference/#runtime-${s}`;
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
      ot(), as(i, null, 10, [
        e,
        o,
        u
      ]), lt();
      return;
    }
  }
  wo(e, s, r, n, l);
}
function wo(e, t, s, n = !0, r = !1) {
  if (r)
    throw e;
  console.error(e);
}
const ye = [];
let je = -1;
const kt = [];
let ht = null, $t = 0;
const Gr = /* @__PURE__ */ Promise.resolve();
let _s = null;
function us(e) {
  const t = _s || Gr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function So(e) {
  let t = je + 1, s = ye.length;
  for (; t < s; ) {
    const n = t + s >>> 1, r = ye[n], i = ns(r);
    i < e || i === e && r.flags & 2 ? t = n + 1 : s = n;
  }
  return t;
}
function En(e) {
  if (!(e.flags & 1)) {
    const t = ns(e), s = ye[ye.length - 1];
    !s || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= ns(s) ? ye.push(e) : ye.splice(So(t), 0, e), e.flags |= 1, Jr();
  }
}
function Jr() {
  _s || (_s = Gr.then(Qr));
}
function Co(e) {
  V(e) ? kt.push(...e) : ht && e.id === -1 ? ht.splice($t + 1, 0, e) : e.flags & 1 || (kt.push(e), e.flags |= 1), Jr();
}
function Kn(e, t, s = je + 1) {
  for (; s < ye.length; s++) {
    const n = ye[s];
    if (n && n.flags & 2) {
      if (e && n.id !== e.uid)
        continue;
      ye.splice(s, 1), s--, n.flags & 4 && (n.flags &= -2), n(), n.flags & 4 || (n.flags &= -2);
    }
  }
}
function zr(e) {
  if (kt.length) {
    const t = [...new Set(kt)].sort(
      (s, n) => ns(s) - ns(n)
    );
    if (kt.length = 0, ht) {
      ht.push(...t);
      return;
    }
    for (ht = t, $t = 0; $t < ht.length; $t++) {
      const s = ht[$t];
      s.flags & 4 && (s.flags &= -2), s.flags & 8 || s(), s.flags &= -2;
    }
    ht = null, $t = 0;
  }
}
const ns = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Qr(e) {
  try {
    for (je = 0; je < ye.length; je++) {
      const t = ye[je];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), as(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; je < ye.length; je++) {
      const t = ye[je];
      t && (t.flags &= -2);
    }
    je = -1, ye.length = 0, zr(), _s = null, (ye.length || kt.length) && Qr();
  }
}
let ge = null, Xr = null;
function ws(e) {
  const t = ge;
  return ge = e, Xr = e && e.type.__scopeId || null, t;
}
function At(e, t = ge, s) {
  if (!t || e._n)
    return e;
  const n = (...r) => {
    n._d && nr(-1);
    const i = ws(t), l = rt.length;
    let a;
    try {
      a = e(...r);
    } finally {
      for (let o = rt.length; o > l; o--) In();
      ws(i), n._d && nr(1);
    }
    return a;
  };
  return n._n = !0, n._c = !0, n._d = !0, n;
}
function Ct(e, t) {
  if (ge === null)
    return e;
  const s = Bs(ge), n = e.dirs || (e.dirs = []);
  for (let r = 0; r < t.length; r++) {
    let [i, l, a, o = ee] = t[r];
    i && (j(i) && (i = {
      mounted: i,
      updated: i
    }), i.deep && st(l), n.push({
      dir: i,
      instance: s,
      value: l,
      oldValue: void 0,
      arg: a,
      modifiers: o
    }));
  }
  return e;
}
function yt(e, t, s, n) {
  const r = e.dirs, i = t && t.dirs;
  for (let l = 0; l < r.length; l++) {
    const a = r[l];
    i && (a.oldValue = i[l].value);
    let o = a.dir[n];
    o && (ot(), Ne(o, s, 8, [
      e.el,
      a,
      e,
      t
    ]), lt());
  }
}
function Ao(e, t) {
  if (me) {
    let s = me.provides;
    const n = me.parent && me.parent.provides;
    n === s && (s = me.provides = Object.create(n)), s[e] = t;
  }
}
function bs(e, t, s = !1) {
  const n = Ei();
  if (n || Mt) {
    let r = Mt ? Mt._context.provides : n ? n.parent == null || n.ce ? n.vnode.appContext && n.vnode.appContext.provides : n.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return s && j(t) ? t.call(n && n.proxy) : t;
  }
}
const xo = /* @__PURE__ */ Symbol.for("v-scx"), Eo = () => bs(xo);
function Je(e, t, s) {
  return Zr(e, t, s);
}
function Zr(e, t, s = ee) {
  const { immediate: n, deep: r, flush: i, once: l } = s, a = ie({}, s), o = t && n || !t && i !== "post";
  let u;
  if (is) {
    if (i === "sync") {
      const y = Eo();
      u = y.__watcherHandles || (y.__watcherHandles = []);
    } else if (!o) {
      const y = () => {
      };
      return y.stop = Ge, y.resume = Ge, y.pause = Ge, y;
    }
  }
  const c = me;
  a.call = (y, k, O) => Ne(y, c, k, O);
  let p = !1;
  i === "post" ? a.scheduler = (y) => {
    we(y, c && c.suspense);
  } : i !== "sync" && (p = !0, a.scheduler = (y, k) => {
    k ? y() : En(y);
  }), a.augmentJob = (y) => {
    t && (y.flags |= 4), p && (y.flags |= 2, c && (y.id = c.uid, y.i = c));
  };
  const v = _o(e, t, a);
  return is && (u ? u.push(v) : o && v()), v;
}
function Ro(e, t, s) {
  const n = this.proxy, r = re(e) ? e.includes(".") ? ei(n, e) : () => n[e] : e.bind(n, n);
  let i;
  j(t) ? i = t : (i = t.handler, s = t);
  const l = cs(this), a = Zr(r, i.bind(n), s);
  return l(), a;
}
function ei(e, t) {
  const s = t.split(".");
  return () => {
    let n = e;
    for (let r = 0; r < s.length && n; r++)
      n = n[s[r]];
    return n;
  };
}
const To = /* @__PURE__ */ Symbol("_vte"), $o = (e) => e.__isTeleport, Js = /* @__PURE__ */ Symbol("_leaveCb");
function Rn(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, Rn(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Re(e, t) {
  return j(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    ie({ name: e.name }, t, { setup: e })
  ) : e;
}
function ti() {
  const e = Ei();
  return e ? (e.appContext.config.idPrefix || "v") + "-" + e.ids[0] + e.ids[1]++ : "";
}
function si(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function qn(e, t) {
  let s;
  return !!((s = Object.getOwnPropertyDescriptor(e, t)) && !s.configurable);
}
const Ss = /* @__PURE__ */ new WeakMap();
function Qt(e, t, s, n, r = !1) {
  if (V(e)) {
    e.forEach(
      (O, U) => Qt(
        O,
        t && (V(t) ? t[U] : t),
        s,
        n,
        r
      )
    );
    return;
  }
  if (Pt(n) && !r) {
    n.shapeFlag & 512 && n.type.__asyncResolved && n.component.subTree.component && Qt(e, t, s, n.component.subTree);
    return;
  }
  const i = n.shapeFlag & 4 ? Bs(n.component) : n.el, l = r ? null : i, { i: a, r: o } = e, u = t && t.r, c = a.refs === ee ? a.refs = {} : a.refs, p = a.setupState, v = /* @__PURE__ */ G(p), y = p === ee ? Ar : (O) => qn(c, O) ? !1 : W(v, O), k = (O, U) => !(U && qn(c, U));
  if (u != null && u !== o) {
    if (Wn(t), re(u))
      c[u] = null, y(u) && (p[u] = null);
    else if (/* @__PURE__ */ be(u)) {
      const O = t;
      k(u, O.k) && (u.value = null), O.k && (c[O.k] = null);
    }
  }
  if (j(o))
    as(o, a, 12, [l, c]);
  else {
    const O = re(o), U = /* @__PURE__ */ be(o);
    if (O || U) {
      const K = () => {
        if (e.f) {
          const x = O ? y(o) ? p[o] : c[o] : k() || !e.k ? o.value : c[e.k];
          if (r)
            V(x) && pn(x, i);
          else if (V(x))
            x.includes(i) || x.push(i);
          else if (O)
            c[o] = [i], y(o) && (p[o] = c[o]);
          else {
            const P = [i];
            k(o, e.k) && (o.value = P), e.k && (c[e.k] = P);
          }
        } else O ? (c[o] = l, y(o) && (p[o] = l)) : U && (k(o, e.k) && (o.value = l), e.k && (c[e.k] = l));
      };
      if (l) {
        const x = () => {
          K(), Ss.delete(e);
        };
        x.id = -1, Ss.set(e, x), we(x, s);
      } else
        Wn(e), K();
    }
  }
}
function Wn(e) {
  const t = Ss.get(e);
  t && (t.flags |= 8, Ss.delete(e));
}
Ms().requestIdleCallback;
Ms().cancelIdleCallback;
const Pt = (e) => !!e.type.__asyncLoader, ni = (e) => e.type.__isKeepAlive;
function Io(e, t) {
  ri(e, "a", t);
}
function Oo(e, t) {
  ri(e, "da", t);
}
function ri(e, t, s = me) {
  const n = e.__wdc || (e.__wdc = () => {
    let r = s;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (Ds(t, n, s), s) {
    let r = s.parent;
    for (; r && r.parent; )
      ni(r.parent.vnode) && ko(n, t, s, r), r = r.parent;
  }
}
function ko(e, t, s, n) {
  const r = Ds(
    t,
    e,
    n,
    !0
    /* prepend */
  );
  ii(() => {
    pn(n[t], r);
  }, s);
}
function Ds(e, t, s = me, n = !1) {
  if (s) {
    const r = s[e] || (s[e] = []), i = t.__weh || (t.__weh = (...l) => {
      ot();
      const a = cs(s), o = Ne(t, s, e, l);
      return a(), lt(), o;
    });
    return n ? r.unshift(i) : r.push(i), i;
  }
}
const ct = (e) => (t, s = me) => {
  (!is || e === "sp") && Ds(e, (...n) => t(...n), s);
}, Po = ct("bm"), Ns = ct("m"), Mo = ct(
  "bu"
), Uo = ct("u"), Et = ct(
  "bum"
), ii = ct("um"), Lo = ct(
  "sp"
), Do = ct("rtg"), No = ct("rtc");
function Yo(e, t = me) {
  Ds("ec", e, t);
}
const Vo = /* @__PURE__ */ Symbol.for("v-ndc");
function nt(e, t, s, n) {
  let r;
  const i = s, l = V(e);
  if (l || re(e)) {
    const a = l && /* @__PURE__ */ St(e);
    let o = !1, u = !1;
    a && (o = !/* @__PURE__ */ Pe(e), u = /* @__PURE__ */ at(e), e = Us(e)), r = new Array(e.length);
    for (let c = 0, p = e.length; c < p; c++)
      r[c] = t(
        o ? u ? Ut(De(e[c])) : De(e[c]) : e[c],
        c,
        void 0,
        i
      );
  } else if (typeof e == "number") {
    r = new Array(e);
    for (let a = 0; a < e; a++)
      r[a] = t(a + 1, a, void 0, i);
  } else if (X(e))
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
function Gn(e, t, s = {}, n, r, i) {
  if (ge.ce || ge.parent && Pt(ge.parent) && ge.parent.ce) {
    const u = s, c = Object.keys(u).length > 0;
    return t !== "default" && (u.name = t), C(), xe(
      te,
      null,
      [le("slot", u, n)],
      c ? -2 : 64
    );
  }
  let l = e[t];
  l && l._c && (l._d = !1);
  const a = rt.length;
  C();
  let o;
  try {
    const u = l && oi(l(s)), c = s.key || i || // slot content array of a dynamic conditional slot may have a branch
    // key attached in the `createSlots` helper, respect that
    u && u.key;
    o = xe(
      te,
      {
        key: (c && !Le(c) ? c : `_${t}`) + // #7256 force differentiate fallback content from actual content
        (!u && n ? "_fb" : "")
      },
      u || (n ? n() : []),
      u && e._ === 1 ? 64 : -2
    );
  } catch (u) {
    for (let c = rt.length; c > a; c--) In();
    throw u;
  } finally {
    l && l._c && (l._d = !0);
  }
  return o.scopeId && (o.slotScopeIds = [o.scopeId + "-s"]), o;
}
function oi(e) {
  return e.some((t) => On(t) ? !(t.type === ut || t.type === te && !oi(t.children)) : !0) ? e : null;
}
const ln = (e) => e ? Ri(e) ? Bs(e) : ln(e.parent) : null, Xt = (
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
    $parent: (e) => ln(e.parent),
    $root: (e) => ln(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ai(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      En(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = us.bind(e.proxy)),
    $watch: (e) => Ro.bind(e)
  })
), zs = (e, t) => e !== ee && !e.__isScriptSetup && W(e, t), Bo = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: s, setupState: n, data: r, props: i, accessCache: l, type: a, appContext: o } = e;
    if (t[0] !== "$") {
      const v = l[t];
      if (v !== void 0)
        switch (v) {
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
        if (zs(n, t))
          return l[t] = 1, n[t];
        if (r !== ee && W(r, t))
          return l[t] = 2, r[t];
        if (W(i, t))
          return l[t] = 3, i[t];
        if (s !== ee && W(s, t))
          return l[t] = 4, s[t];
        an && (l[t] = 0);
      }
    }
    const u = Xt[t];
    let c, p;
    if (u)
      return t === "$attrs" && pe(e.attrs, "get", ""), u(e);
    if (
      // css module (injected by vue-loader)
      (c = a.__cssModules) && (c = c[t])
    )
      return c;
    if (s !== ee && W(s, t))
      return l[t] = 4, s[t];
    if (
      // global properties
      p = o.config.globalProperties, W(p, t)
    )
      return p[t];
  },
  set({ _: e }, t, s) {
    const { data: n, setupState: r, ctx: i } = e;
    return zs(r, t) ? (r[t] = s, !0) : n !== ee && W(n, t) ? (n[t] = s, !0) : W(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = s, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: s, ctx: n, appContext: r, props: i, type: l }
  }, a) {
    let o;
    return !!(s[a] || e !== ee && a[0] !== "$" && W(e, a) || zs(t, a) || W(i, a) || W(n, a) || W(Xt, a) || W(r.config.globalProperties, a) || (o = l.__cssModules) && o[a]);
  },
  defineProperty(e, t, s) {
    return s.get != null ? e._.accessCache[t] = 0 : W(s, "value") && this.set(e, t, s.value, null), Reflect.defineProperty(e, t, s);
  }
};
function Jn(e) {
  return V(e) ? e.reduce(
    (t, s) => (t[s] = null, t),
    {}
  ) : e;
}
let an = !0;
function Fo(e) {
  const t = ai(e), s = e.proxy, n = e.ctx;
  an = !1, t.beforeCreate && zn(t.beforeCreate, e, "bc");
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
    beforeUpdate: y,
    updated: k,
    activated: O,
    deactivated: U,
    beforeDestroy: K,
    beforeUnmount: x,
    destroyed: P,
    unmounted: b,
    render: B,
    renderTracked: he,
    renderTriggered: Ie,
    errorCaptured: _e,
    serverPrefetch: gt,
    // public API
    expose: Me,
    inheritAttrs: ft,
    // assets
    components: bt,
    directives: Rt,
    filters: dt
  } = t;
  if (u && Ho(u, n, null), l)
    for (const ne in l) {
      const z = l[ne];
      j(z) && (n[ne] = z.bind(s));
    }
  if (r) {
    const ne = r.call(s, s);
    X(ne) && (e.data = /* @__PURE__ */ Cn(ne));
  }
  if (an = !0, i)
    for (const ne in i) {
      const z = i[ne], Ye = j(z) ? z.bind(s, s) : j(z.get) ? z.get.bind(s, s) : Ge, vt = !j(z) && j(z.set) ? z.set.bind(s) : Ge, ze = Dt({
        get: Ye,
        set: vt
      });
      Object.defineProperty(n, ne, {
        enumerable: !0,
        configurable: !0,
        get: () => ze.value,
        set: (Oe) => ze.value = Oe
      });
    }
  if (a)
    for (const ne in a)
      li(a[ne], n, s, ne);
  if (o) {
    const ne = j(o) ? o.call(s) : o;
    Reflect.ownKeys(ne).forEach((z) => {
      Ao(z, ne[z]);
    });
  }
  c && zn(c, e, "c");
  function ae(ne, z) {
    V(z) ? z.forEach((Ye) => ne(Ye.bind(s))) : z && ne(z.bind(s));
  }
  if (ae(Po, p), ae(Ns, v), ae(Mo, y), ae(Uo, k), ae(Io, O), ae(Oo, U), ae(Yo, _e), ae(No, he), ae(Do, Ie), ae(Et, x), ae(ii, b), ae(Lo, gt), V(Me))
    if (Me.length) {
      const ne = e.exposed || (e.exposed = {});
      Me.forEach((z) => {
        Object.defineProperty(ne, z, {
          get: () => s[z],
          set: (Ye) => s[z] = Ye,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  B && e.render === Ge && (e.render = B), ft != null && (e.inheritAttrs = ft), bt && (e.components = bt), Rt && (e.directives = Rt), gt && si(e);
}
function Ho(e, t, s = Ge) {
  V(e) && (e = un(e));
  for (const n in e) {
    const r = e[n];
    let i;
    X(r) ? "default" in r ? i = bs(
      r.from || n,
      r.default,
      !0
    ) : i = bs(r.from || n) : i = bs(r), /* @__PURE__ */ be(i) ? Object.defineProperty(t, n, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (l) => i.value = l
    }) : t[n] = i;
  }
}
function zn(e, t, s) {
  Ne(
    V(e) ? e.map((n) => n.bind(t.proxy)) : e.bind(t.proxy),
    t,
    s
  );
}
function li(e, t, s, n) {
  let r = n.includes(".") ? ei(s, n) : () => s[n];
  if (re(e)) {
    const i = t[e];
    j(i) && Je(r, i);
  } else if (j(e))
    Je(r, e.bind(s));
  else if (X(e))
    if (V(e))
      e.forEach((i) => li(i, t, s, n));
    else {
      const i = j(e.handler) ? e.handler.bind(s) : t[e.handler];
      j(i) && Je(r, i, e);
    }
}
function ai(e) {
  const t = e.type, { mixins: s, extends: n } = t, {
    mixins: r,
    optionsCache: i,
    config: { optionMergeStrategies: l }
  } = e.appContext, a = i.get(t);
  let o;
  return a ? o = a : !r.length && !s && !n ? o = t : (o = {}, r.length && r.forEach(
    (u) => Cs(o, u, l, !0)
  ), Cs(o, t, l)), X(t) && i.set(t, o), o;
}
function Cs(e, t, s, n = !1) {
  const { mixins: r, extends: i } = t;
  i && Cs(e, i, s, !0), r && r.forEach(
    (l) => Cs(e, l, s, !0)
  );
  for (const l in t)
    if (!(n && l === "expose")) {
      const a = jo[l] || s && s[l];
      e[l] = a ? a(e[l], t[l]) : t[l];
    }
  return e;
}
const jo = {
  data: Qn,
  props: Xn,
  emits: Xn,
  // objects
  methods: qt,
  computed: qt,
  // lifecycle
  beforeCreate: ve,
  created: ve,
  beforeMount: ve,
  mounted: ve,
  beforeUpdate: ve,
  updated: ve,
  beforeDestroy: ve,
  beforeUnmount: ve,
  destroyed: ve,
  unmounted: ve,
  activated: ve,
  deactivated: ve,
  errorCaptured: ve,
  serverPrefetch: ve,
  // assets
  components: qt,
  directives: qt,
  // watch
  watch: qo,
  // provide / inject
  provide: Qn,
  inject: Ko
};
function Qn(e, t) {
  return t ? e ? function() {
    return ie(
      j(e) ? e.call(this, this) : e,
      j(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Ko(e, t) {
  return qt(un(e), un(t));
}
function un(e) {
  if (V(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++)
      t[e[s]] = e[s];
    return t;
  }
  return e;
}
function ve(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function qt(e, t) {
  return e ? ie(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Xn(e, t) {
  return e ? V(e) && V(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : ie(
    /* @__PURE__ */ Object.create(null),
    Jn(e),
    Jn(t ?? {})
  ) : t;
}
function qo(e, t) {
  if (!e) return t;
  if (!t) return e;
  const s = ie(/* @__PURE__ */ Object.create(null), e);
  for (const n in t)
    s[n] = ve(e[n], t[n]);
  return s;
}
function ui() {
  return {
    app: null,
    config: {
      isNativeTag: Ar,
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
  return function(n, r = null) {
    j(n) || (n = ie({}, n)), r != null && !X(r) && (r = null);
    const i = ui(), l = /* @__PURE__ */ new WeakSet(), a = [];
    let o = !1;
    const u = i.app = {
      _uid: Wo++,
      _component: n,
      _props: r,
      _container: null,
      _context: i,
      _instance: null,
      version: Al,
      get config() {
        return i.config;
      },
      set config(c) {
      },
      use(c, ...p) {
        return l.has(c) || (c && j(c.install) ? (l.add(c), c.install(u, ...p)) : j(c) && (l.add(c), c(u, ...p))), u;
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
          const y = u._ceVNode || le(n, r);
          return y.appContext = i, v === !0 ? v = "svg" : v === !1 && (v = void 0), e(y, c, v), o = !0, u._container = c, c.__vue_app__ = u, Bs(y.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        o && (Ne(
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
const Jo = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ce(t)}Modifiers`] || e[`${ke(t)}Modifiers`];
function zo(e, t, ...s) {
  if (e.isUnmounted) return;
  const n = e.vnode.props || ee;
  let r = s;
  const i = t.startsWith("update:"), l = i && Jo(n, t.slice(7));
  l && (l.trim && (r = s.map((c) => re(c) ? c.trim() : c)), l.number && (r = s.map(Ps)));
  let a, o = n[a = js(t)] || // also try camelCase event handler (#2249)
  n[a = js(Ce(t))];
  !o && i && (o = n[a = js(ke(t))]), o && Ne(
    o,
    e,
    6,
    r
  );
  const u = n[a + "Once"];
  if (u) {
    if (!e.emitted)
      e.emitted = {};
    else if (e.emitted[a])
      return;
    e.emitted[a] = !0, Ne(
      u,
      e,
      6,
      r
    );
  }
}
const Qo = /* @__PURE__ */ new WeakMap();
function ci(e, t, s = !1) {
  const n = s ? Qo : t.emitsCache, r = n.get(e);
  if (r !== void 0)
    return r;
  const i = e.emits;
  let l = {}, a = !1;
  if (!j(e)) {
    const o = (u) => {
      const c = ci(u, t, !0);
      c && (a = !0, ie(l, c));
    };
    !s && t.mixins.length && t.mixins.forEach(o), e.extends && o(e.extends), e.mixins && e.mixins.forEach(o);
  }
  return !i && !a ? (X(e) && n.set(e, null), null) : (V(i) ? i.forEach((o) => l[o] = null) : ie(l, i), X(e) && n.set(e, l), l);
}
function Ys(e, t) {
  return !e || !$s(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), W(e, t[0].toLowerCase() + t.slice(1)) || W(e, ke(t)) || W(e, t));
}
function Zn(e) {
  const {
    type: t,
    vnode: s,
    proxy: n,
    withProxy: r,
    propsOptions: [i],
    slots: l,
    attrs: a,
    emit: o,
    render: u,
    renderCache: c,
    props: p,
    data: v,
    setupState: y,
    ctx: k,
    inheritAttrs: O
  } = e, U = ws(e);
  let K, x;
  try {
    if (s.shapeFlag & 4) {
      const b = r || n, B = b;
      K = qe(
        u.call(
          B,
          b,
          c,
          p,
          y,
          v,
          k
        )
      ), x = a;
    } else {
      const b = t;
      K = qe(
        b.length > 1 ? b(
          p,
          { attrs: a, slots: l, emit: o }
        ) : b(
          p,
          null
        )
      ), x = t.props ? a : Xo(a);
    }
  } catch (b) {
    rt.length = 0, Ls(b, e, 1), K = le(ut);
  }
  let P = K;
  if (x && O !== !1) {
    const b = Object.keys(x), { shapeFlag: B } = P;
    b.length && B & 7 && (i && b.some(Is) && (x = Zo(
      x,
      i
    )), P = Lt(P, x, !1, !0));
  }
  return s.dirs && (P = Lt(P, null, !1, !0), P.dirs = P.dirs ? P.dirs.concat(s.dirs) : s.dirs), s.transition && Rn(P, s.transition), K = P, ws(U), K;
}
const Xo = (e) => {
  let t;
  for (const s in e)
    (s === "class" || s === "style" || $s(s)) && ((t || (t = {}))[s] = e[s]);
  return t;
}, Zo = (e, t) => {
  const s = {};
  for (const n in e)
    (!Is(n) || !(n.slice(9) in t)) && (s[n] = e[n]);
  return s;
};
function el(e, t, s) {
  const { props: n, children: r, component: i } = e, { props: l, children: a, patchFlag: o } = t, u = i.emitsOptions;
  if (t.dirs || t.transition)
    return !0;
  if (s && o >= 0) {
    if (o & 1024)
      return !0;
    if (o & 16)
      return n ? er(n, l, u) : !!l;
    if (o & 8) {
      const c = t.dynamicProps;
      for (let p = 0; p < c.length; p++) {
        const v = c[p];
        if (fi(l, n, v) && !Ys(u, v))
          return !0;
      }
    }
  } else
    return (r || a) && (!a || !a.$stable) ? !0 : n === l ? !1 : n ? l ? er(n, l, u) : !0 : !!l;
  return !1;
}
function er(e, t, s) {
  const n = Object.keys(t);
  if (n.length !== Object.keys(e).length)
    return !0;
  for (let r = 0; r < n.length; r++) {
    const i = n[r];
    if (fi(t, e, i) && !Ys(s, i))
      return !0;
  }
  return !1;
}
function fi(e, t, s) {
  const n = e[s], r = t[s];
  return s === "style" && X(n) && X(r) ? !Vt(n, r) : n !== r;
}
function tl({ vnode: e, parent: t, suspense: s }, n) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.suspense.vnode.el = r.el = n, e = r), r === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
  s && s.activeBranch === e && (s.vnode.el = n);
}
const di = {}, hi = () => Object.create(di), pi = (e) => Object.getPrototypeOf(e) === di;
function sl(e, t, s, n = !1) {
  const r = {}, i = hi();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), gi(e, t, r, i);
  for (const l in e.propsOptions[0])
    l in r || (r[l] = void 0);
  s ? e.props = n ? r : /* @__PURE__ */ fo(r) : e.type.props ? e.props = r : e.props = i, e.attrs = i;
}
function nl(e, t, s, n) {
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
    (n || l > 0) && !(l & 16)
  ) {
    if (l & 8) {
      const c = e.vnode.dynamicProps;
      for (let p = 0; p < c.length; p++) {
        let v = c[p];
        if (Ys(e.emitsOptions, v))
          continue;
        const y = t[v];
        if (o)
          if (W(i, v))
            y !== i[v] && (i[v] = y, u = !0);
          else {
            const k = Ce(v);
            r[k] = cn(
              o,
              a,
              k,
              y,
              e,
              !1
            );
          }
        else
          y !== i[v] && (i[v] = y, u = !0);
      }
    }
  } else {
    gi(e, t, r, i) && (u = !0);
    let c;
    for (const p in a)
      (!t || // for camelCase
      !W(t, p) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = ke(p)) === p || !W(t, c))) && (o ? s && // for camelCase
      (s[p] !== void 0 || // for kebab-case
      s[c] !== void 0) && (r[p] = cn(
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
function gi(e, t, s, n) {
  const [r, i] = e.propsOptions;
  let l = !1, a;
  if (t)
    for (let o in t) {
      if (Gt(o))
        continue;
      const u = t[o];
      let c;
      r && W(r, c = Ce(o)) ? !i || !i.includes(c) ? s[c] = u : (a || (a = {}))[c] = u : Ys(e.emitsOptions, o) || (!(o in n) || u !== n[o]) && (n[o] = u, l = !0);
    }
  if (i) {
    const o = /* @__PURE__ */ G(s), u = a || ee;
    for (let c = 0; c < i.length; c++) {
      const p = i[c];
      s[p] = cn(
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
function cn(e, t, s, n, r, i) {
  const l = e[s];
  if (l != null) {
    const a = W(l, "default");
    if (a && n === void 0) {
      const o = l.default;
      if (l.type !== Function && !l.skipFactory && j(o)) {
        const { propsDefaults: u } = r;
        if (s in u)
          n = u[s];
        else {
          const c = cs(r);
          n = u[s] = o.call(
            null,
            t
          ), c();
        }
      } else
        n = o;
      r.ce && r.ce._setProp(s, n);
    }
    l[
      0
      /* shouldCast */
    ] && (i && !a ? n = !1 : l[
      1
      /* shouldCastTrue */
    ] && (n === "" || n === ke(s)) && (n = !0));
  }
  return n;
}
const rl = /* @__PURE__ */ new WeakMap();
function bi(e, t, s = !1) {
  const n = s ? rl : t.propsCache, r = n.get(e);
  if (r)
    return r;
  const i = e.props, l = {}, a = [];
  let o = !1;
  if (!j(e)) {
    const c = (p) => {
      o = !0;
      const [v, y] = bi(p, t, !0);
      ie(l, v), y && a.push(...y);
    };
    !s && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!i && !o)
    return X(e) && n.set(e, It), It;
  if (V(i))
    for (let c = 0; c < i.length; c++) {
      const p = Ce(i[c]);
      tr(p) && (l[p] = ee);
    }
  else if (i)
    for (const c in i) {
      const p = Ce(c);
      if (tr(p)) {
        const v = i[c], y = l[p] = V(v) || j(v) ? { type: v } : ie({}, v), k = y.type;
        let O = !1, U = !0;
        if (V(k))
          for (let K = 0; K < k.length; ++K) {
            const x = k[K], P = j(x) && x.name;
            if (P === "Boolean") {
              O = !0;
              break;
            } else P === "String" && (U = !1);
          }
        else
          O = j(k) && k.name === "Boolean";
        y[
          0
          /* shouldCast */
        ] = O, y[
          1
          /* shouldCastTrue */
        ] = U, (O || W(y, "default")) && a.push(p);
      }
    }
  const u = [l, a];
  return X(e) && n.set(e, u), u;
}
function tr(e) {
  return e[0] !== "$" && !Gt(e);
}
const Tn = (e) => e === "_" || e === "_ctx" || e === "$stable", $n = (e) => V(e) ? e.map(qe) : [qe(e)], il = (e, t, s) => {
  if (t._n)
    return t;
  const n = At((...r) => $n(t(...r)), s);
  return n._c = !1, n;
}, vi = (e, t, s) => {
  const n = e._ctx;
  for (const r in e) {
    if (Tn(r)) continue;
    const i = e[r];
    if (j(i))
      t[r] = il(r, i, n);
    else if (i != null) {
      const l = $n(i);
      t[r] = () => l;
    }
  }
}, yi = (e, t) => {
  const s = $n(t);
  e.slots.default = () => s;
}, mi = (e, t, s) => {
  for (const n in t)
    (s || !Tn(n)) && (e[n] = t[n]);
}, ol = (e, t, s) => {
  const n = e.slots = hi();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (mi(n, t, s), s && Tr(n, "_", r, !0)) : vi(t, n);
  } else t && yi(e, t);
}, ll = (e, t, s) => {
  const { vnode: n, slots: r } = e;
  let i = !0, l = ee;
  if (n.shapeFlag & 32) {
    const a = t._;
    a ? s && a === 1 ? i = !1 : mi(r, t, s) : (i = !t.$stable, vi(t, r)), l = t;
  } else t && (yi(e, t), l = { default: 1 });
  if (i)
    for (const a in r)
      !Tn(a) && l[a] == null && delete r[a];
}, we = dl;
function al(e) {
  return ul(e);
}
function ul(e, t) {
  const s = Ms();
  s.__VUE__ = !0;
  const {
    insert: n,
    remove: r,
    patchProp: i,
    createElement: l,
    createText: a,
    createComment: o,
    setText: u,
    setElementText: c,
    parentNode: p,
    nextSibling: v,
    setScopeId: y = Ge,
    insertStaticContent: k
  } = e, O = (f, h, g, S = null, w = null, m = null, R = void 0, E = null, A = !!h.dynamicChildren) => {
    if (f === h)
      return;
    f && !jt(f, h) && (S = Qe(f), Oe(f, w, m, !0), f = null), h.patchFlag === -2 && (A = !1, h.dynamicChildren = null);
    const { type: _, ref: Y, shapeFlag: I } = h;
    switch (_) {
      case Vs:
        U(f, h, g, S);
        break;
      case ut:
        K(f, h, g, S);
        break;
      case Xs:
        f == null && x(h, g, S, R);
        break;
      case te:
        bt(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          E,
          A
        );
        break;
      default:
        I & 1 ? B(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          E,
          A
        ) : I & 6 ? Rt(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          E,
          A
        ) : (I & 64 || I & 128) && _.process(
          f,
          h,
          g,
          S,
          w,
          m,
          R,
          E,
          A,
          Bt
        );
    }
    Y != null && w ? Qt(Y, f && f.ref, m, h || f, !h) : Y == null && f && f.ref != null && Qt(f.ref, null, m, f, !0);
  }, U = (f, h, g, S) => {
    if (f == null)
      n(
        h.el = a(h.children),
        g,
        S
      );
    else {
      const w = h.el = f.el;
      h.children !== f.children && u(w, h.children);
    }
  }, K = (f, h, g, S) => {
    f == null ? n(
      h.el = o(h.children || ""),
      g,
      S
    ) : h.el = f.el;
  }, x = (f, h, g, S) => {
    [f.el, f.anchor] = k(
      f.children,
      h,
      g,
      S,
      f.el,
      f.anchor
    );
  }, P = ({ el: f, anchor: h }, g, S) => {
    let w;
    for (; f && f !== h; )
      w = v(f), n(f, g, S), f = w;
    n(h, g, S);
  }, b = ({ el: f, anchor: h }) => {
    let g;
    for (; f && f !== h; )
      g = v(f), r(f), f = g;
    r(h);
  }, B = (f, h, g, S, w, m, R, E, A) => {
    if (h.type === "svg" ? R = "svg" : h.type === "math" && (R = "mathml"), f == null)
      he(
        h,
        g,
        S,
        w,
        m,
        R,
        E,
        A
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
          E,
          A
        );
      } finally {
        _ && _._endPatch();
      }
    }
  }, he = (f, h, g, S, w, m, R, E) => {
    let A, _;
    const { props: Y, shapeFlag: I, transition: N, dirs: F } = f;
    if (A = f.el = l(
      f.type,
      m,
      Y && Y.is,
      Y
    ), I & 8 ? c(A, f.children) : I & 16 && _e(
      f.children,
      A,
      null,
      S,
      w,
      Qs(f, m),
      R,
      E
    ), F && yt(f, null, S, "created"), Ie(A, f, f.scopeId, R, S), Y) {
      for (const Z in Y)
        Z !== "value" && !Gt(Z) && i(A, Z, null, Y[Z], m, S);
      "value" in Y && i(A, "value", null, Y.value, m), (_ = Y.onVnodeBeforeMount) && He(_, S, f);
    }
    F && yt(f, null, S, "beforeMount");
    const q = cl(w, N);
    q && N.beforeEnter(A), n(A, h, g), ((_ = Y && Y.onVnodeMounted) || q || F) && we(() => {
      try {
        _ && He(_, S, f), q && N.enter(A), F && yt(f, null, S, "mounted");
      } finally {
      }
    }, w);
  }, Ie = (f, h, g, S, w) => {
    if (g && y(f, g), S)
      for (let m = 0; m < S.length; m++)
        y(f, S[m]);
    if (w) {
      let m = w.subTree;
      if (h === m || Ci(m.type) && (m.ssContent === h || m.ssFallback === h)) {
        const R = w.vnode;
        Ie(
          f,
          R,
          R.scopeId,
          R.slotScopeIds,
          w.parent
        );
      }
    }
  }, _e = (f, h, g, S, w, m, R, E, A = 0) => {
    for (let _ = A; _ < f.length; _++) {
      const Y = f[_] = E ? et(f[_]) : qe(f[_]);
      O(
        null,
        Y,
        h,
        g,
        S,
        w,
        m,
        R,
        E
      );
    }
  }, gt = (f, h, g, S, w, m, R) => {
    const E = h.el = f.el;
    let { patchFlag: A, dynamicChildren: _, dirs: Y } = h;
    A |= f.patchFlag & 16;
    const I = f.props || ee, N = h.props || ee;
    let F;
    if (g && mt(g, !1), (F = N.onVnodeBeforeUpdate) && He(F, g, h, f), Y && yt(h, f, g, "beforeUpdate"), g && mt(g, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    _ && (!f.dynamicChildren || f.dynamicChildren.length !== _.length) && (A = 0, R = !1, _ = null), (I.innerHTML && N.innerHTML == null || I.textContent && N.textContent == null) && c(E, ""), _ ? Me(
      f.dynamicChildren,
      _,
      E,
      g,
      S,
      Qs(h, w),
      m
    ) : R || z(
      f,
      h,
      E,
      null,
      g,
      S,
      Qs(h, w),
      m,
      !1
    ), A > 0) {
      if (A & 16)
        ft(E, I, N, g, w);
      else if (A & 2 && I.class !== N.class && i(E, "class", null, N.class, w), A & 4 && i(E, "style", I.style, N.style, w), A & 8) {
        const q = h.dynamicProps;
        for (let Z = 0; Z < q.length; Z++) {
          const Q = q[Z], oe = I[Q], ce = N[Q];
          (ce !== oe || Q === "value") && i(E, Q, oe, ce, w, g);
        }
      }
      A & 1 && f.children !== h.children && c(E, h.children);
    } else !R && _ == null && ft(E, I, N, g, w);
    ((F = N.onVnodeUpdated) || Y) && we(() => {
      F && He(F, g, h, f), Y && yt(h, f, g, "updated");
    }, S);
  }, Me = (f, h, g, S, w, m, R) => {
    for (let E = 0; E < h.length; E++) {
      const A = f[E], _ = h[E], Y = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        A.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (A.type === te || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !jt(A, _) || // - In the case of a component, it could contain anything.
        A.shapeFlag & 198) ? p(A.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      O(
        A,
        _,
        Y,
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
      if (h !== ee)
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
        const R = g[m], E = h[m];
        R !== E && m !== "value" && i(f, m, E, R, w, S);
      }
      "value" in g && i(f, "value", h.value, g.value, w);
    }
  }, bt = (f, h, g, S, w, m, R, E, A) => {
    const _ = h.el = f ? f.el : a(""), Y = h.anchor = f ? f.anchor : a("");
    let { patchFlag: I, dynamicChildren: N, slotScopeIds: F } = h;
    F && (E = E ? E.concat(F) : F), f == null ? (n(_, g, S), n(Y, g, S), _e(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      h.children || [],
      g,
      Y,
      w,
      m,
      R,
      E,
      A
    )) : I > 0 && I & 64 && N && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    f.dynamicChildren && f.dynamicChildren.length === N.length ? (Me(
      f.dynamicChildren,
      N,
      g,
      w,
      m,
      R,
      E
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (h.key != null || w && h === w.subTree) && _i(
      f,
      h,
      !0
      /* shallow */
    )) : z(
      f,
      h,
      g,
      Y,
      w,
      m,
      R,
      E,
      A
    );
  }, Rt = (f, h, g, S, w, m, R, E, A) => {
    h.slotScopeIds = E, f == null ? h.shapeFlag & 512 ? w.ctx.activate(
      h,
      g,
      S,
      R,
      A
    ) : dt(
      h,
      g,
      S,
      w,
      m,
      R,
      A
    ) : fs(f, h, A);
  }, dt = (f, h, g, S, w, m, R) => {
    const E = f.component = yl(
      f,
      S,
      w
    );
    if (ni(f) && (E.ctx.renderer = Bt), ml(E, !1, R), E.asyncDep) {
      if (w && w.registerDep(E, ae, R), !f.el) {
        const A = E.subTree = le(ut);
        K(null, A, h, g), f.placeholder = A.el;
      }
    } else
      ae(
        E,
        f,
        h,
        g,
        w,
        m,
        R
      );
  }, fs = (f, h, g) => {
    const S = h.component = f.component;
    if (el(f, h, g))
      if (S.asyncDep && !S.asyncResolved) {
        ne(S, h, g);
        return;
      } else
        S.next = h, S.update();
    else
      h.el = f.el, S.vnode = h;
  }, ae = (f, h, g, S, w, m, R) => {
    const E = () => {
      if (f.isMounted) {
        let { next: I, bu: N, u: F, parent: q, vnode: Z } = f;
        {
          const Be = wi(f);
          if (Be) {
            I && (I.el = Z.el, ne(f, I, R)), Be.asyncDep.then(() => {
              we(() => {
                f.isUnmounted || _();
              }, w);
            });
            return;
          }
        }
        let Q = I, oe;
        mt(f, !1), I ? (I.el = Z.el, ne(f, I, R)) : I = Z, N && gs(N), (oe = I.props && I.props.onVnodeBeforeUpdate) && He(oe, q, I, Z), mt(f, !0);
        const ce = Zn(f), Ve = f.subTree;
        f.subTree = ce, O(
          Ve,
          ce,
          // parent may have changed if it's in a teleport
          p(Ve.el),
          // anchor may have changed if it's in a fragment
          Qe(Ve),
          f,
          w,
          m
        ), I.el = ce.el, Q === null && tl(f, ce.el), F && we(F, w), (oe = I.props && I.props.onVnodeUpdated) && we(
          () => He(oe, q, I, Z),
          w
        );
      } else {
        let I;
        const { el: N, props: F } = h, { bm: q, m: Z, parent: Q, root: oe, type: ce } = f, Ve = Pt(h);
        mt(f, !1), q && gs(q), !Ve && (I = F && F.onVnodeBeforeMount) && He(I, Q, h), mt(f, !0);
        {
          oe.ce && oe.ce._hasShadowRoot() && oe.ce._injectChildStyle(
            ce,
            f.parent ? f.parent.type : void 0
          );
          const Be = f.subTree = Zn(f);
          O(
            null,
            Be,
            g,
            S,
            f,
            w,
            m
          ), h.el = Be.el;
        }
        if (Z && we(Z, w), !Ve && (I = F && F.onVnodeMounted)) {
          const Be = h;
          we(
            () => He(I, Q, Be),
            w
          );
        }
        (h.shapeFlag & 256 || Q && Pt(Q.vnode) && Q.vnode.shapeFlag & 256) && f.a && we(f.a, w), f.isMounted = !0, h = g = S = null;
      }
    };
    f.scope.on();
    const A = f.effect = new kr(E);
    f.scope.off();
    const _ = f.update = A.run.bind(A), Y = f.job = A.runIfDirty.bind(A);
    Y.i = f, Y.id = f.uid, A.scheduler = () => En(Y), mt(f, !0), _();
  }, ne = (f, h, g) => {
    h.component = f;
    const S = f.vnode.props;
    f.vnode = h, f.next = null, nl(f, h.props, S, g), ll(f, h.children, g), ot(), Kn(f), lt();
  }, z = (f, h, g, S, w, m, R, E, A = !1) => {
    const _ = f && f.children, Y = f ? f.shapeFlag : 0, I = h.children, { patchFlag: N, shapeFlag: F } = h;
    if (N > 0) {
      if (N & 128) {
        vt(
          _,
          I,
          g,
          S,
          w,
          m,
          R,
          E,
          A
        );
        return;
      } else if (N & 256) {
        Ye(
          _,
          I,
          g,
          S,
          w,
          m,
          R,
          E,
          A
        );
        return;
      }
    }
    F & 8 ? (Y & 16 && ue(_, w, m), I !== _ && c(g, I)) : Y & 16 ? F & 16 ? vt(
      _,
      I,
      g,
      S,
      w,
      m,
      R,
      E,
      A
    ) : ue(_, w, m, !0) : (Y & 8 && c(g, ""), F & 16 && _e(
      I,
      g,
      S,
      w,
      m,
      R,
      E,
      A
    ));
  }, Ye = (f, h, g, S, w, m, R, E, A) => {
    f = f || It, h = h || It;
    const _ = f.length, Y = h.length, I = Math.min(_, Y);
    let N;
    for (N = 0; N < I; N++) {
      const F = h[N] = A ? et(h[N]) : qe(h[N]);
      O(
        f[N],
        F,
        g,
        null,
        w,
        m,
        R,
        E,
        A
      );
    }
    _ > Y ? ue(
      f,
      w,
      m,
      !0,
      !1,
      I
    ) : _e(
      h,
      g,
      S,
      w,
      m,
      R,
      E,
      A,
      I
    );
  }, vt = (f, h, g, S, w, m, R, E, A) => {
    let _ = 0;
    const Y = h.length;
    let I = f.length - 1, N = Y - 1;
    for (; _ <= I && _ <= N; ) {
      const F = f[_], q = h[_] = A ? et(h[_]) : qe(h[_]);
      if (jt(F, q))
        O(
          F,
          q,
          g,
          null,
          w,
          m,
          R,
          E,
          A
        );
      else
        break;
      _++;
    }
    for (; _ <= I && _ <= N; ) {
      const F = f[I], q = h[N] = A ? et(h[N]) : qe(h[N]);
      if (jt(F, q))
        O(
          F,
          q,
          g,
          null,
          w,
          m,
          R,
          E,
          A
        );
      else
        break;
      I--, N--;
    }
    if (_ > I) {
      if (_ <= N) {
        const F = N + 1, q = F < Y ? h[F].el : S;
        for (; _ <= N; )
          O(
            null,
            h[_] = A ? et(h[_]) : qe(h[_]),
            g,
            q,
            w,
            m,
            R,
            E,
            A
          ), _++;
      }
    } else if (_ > N)
      for (; _ <= I; )
        Oe(f[_], w, m, !0), _++;
    else {
      const F = _, q = _, Z = /* @__PURE__ */ new Map();
      for (_ = q; _ <= N; _++) {
        const Ae = h[_] = A ? et(h[_]) : qe(h[_]);
        Ae.key != null && Z.set(Ae.key, _);
      }
      let Q, oe = 0;
      const ce = N - q + 1;
      let Ve = !1, Be = 0;
      const Ft = new Array(ce);
      for (_ = 0; _ < ce; _++) Ft[_] = 0;
      for (_ = F; _ <= I; _++) {
        const Ae = f[_];
        if (oe >= ce) {
          Oe(Ae, w, m, !0);
          continue;
        }
        let Fe;
        if (Ae.key != null)
          Fe = Z.get(Ae.key);
        else
          for (Q = q; Q <= N; Q++)
            if (Ft[Q - q] === 0 && jt(Ae, h[Q])) {
              Fe = Q;
              break;
            }
        Fe === void 0 ? Oe(Ae, w, m, !0) : (Ft[Fe - q] = _ + 1, Fe >= Be ? Be = Fe : Ve = !0, O(
          Ae,
          h[Fe],
          g,
          null,
          w,
          m,
          R,
          E,
          A
        ), oe++);
      }
      const Dn = Ve ? fl(Ft) : It;
      for (Q = Dn.length - 1, _ = ce - 1; _ >= 0; _--) {
        const Ae = q + _, Fe = h[Ae], Nn = h[Ae + 1], Yn = Ae + 1 < Y ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Nn.el || Si(Nn)
        ) : S;
        Ft[_] === 0 ? O(
          null,
          Fe,
          g,
          Yn,
          w,
          m,
          R,
          E,
          A
        ) : Ve && (Q < 0 || _ !== Dn[Q] ? ze(Fe, g, Yn, 2) : Q--);
      }
    }
  }, ze = (f, h, g, S, w = null) => {
    const { el: m, type: R, transition: E, children: A, shapeFlag: _ } = f;
    if (_ & 6) {
      ze(f.component.subTree, h, g, S);
      return;
    }
    if (_ & 128) {
      f.suspense.move(h, g, S);
      return;
    }
    if (_ & 64) {
      R.move(f, h, g, Bt);
      return;
    }
    if (R === te) {
      n(m, h, g);
      for (let I = 0; I < A.length; I++)
        ze(A[I], h, g, S);
      n(f.anchor, h, g);
      return;
    }
    if (R === Xs) {
      P(f, h, g);
      return;
    }
    if (S !== 2 && _ & 1 && E)
      if (S === 0)
        E.persisted && !m[Js] ? n(m, h, g) : (E.beforeEnter(m), n(m, h, g), we(() => E.enter(m), w));
      else {
        const { leave: I, delayLeave: N, afterLeave: F } = E, q = () => {
          f.ctx.isUnmounted ? r(m) : n(m, h, g);
        }, Z = () => {
          const Q = m._isLeaving || !!m[Js];
          m._isLeaving && m[Js](
            !0
            /* cancelled */
          ), E.persisted && !Q ? q() : I(m, () => {
            q(), F && F();
          });
        };
        N ? N(m, q, Z) : Z();
      }
    else
      n(m, h, g);
  }, Oe = (f, h, g, S = !1, w = !1) => {
    const {
      type: m,
      props: R,
      ref: E,
      children: A,
      dynamicChildren: _,
      shapeFlag: Y,
      patchFlag: I,
      dirs: N,
      cacheIndex: F,
      memo: q
    } = f;
    if (I === -2 && (w = !1), E != null && (ot(), Qt(E, null, g, f, !0), lt()), F != null && (h.renderCache[F] = void 0), Y & 256) {
      h.ctx.deactivate(f);
      return;
    }
    const Z = Y & 1 && N, Q = !Pt(f);
    let oe;
    if (Q && (oe = R && R.onVnodeBeforeUnmount) && He(oe, h, f), Y & 6)
      D(f.component, g, S);
    else {
      if (Y & 128) {
        f.suspense.unmount(g, S);
        return;
      }
      Z && yt(f, null, h, "beforeUnmount"), Y & 64 ? f.type.remove(
        f,
        h,
        g,
        Bt,
        S
      ) : _ && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !_.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (m !== te || I > 0 && I & 64) ? ue(
        _,
        h,
        g,
        !1,
        !0
      ) : (m === te && I & 384 || !w && Y & 16) && ue(A, h, g), S && L(f);
    }
    const ce = q != null && F == null;
    (Q && (oe = R && R.onVnodeUnmounted) || Z || ce) && we(() => {
      oe && He(oe, h, f), Z && yt(f, null, h, "unmounted"), ce && (f.el = null);
    }, g);
  }, L = (f) => {
    const { type: h, el: g, anchor: S, transition: w } = f;
    if (h === te) {
      $(g, S);
      return;
    }
    if (h === Xs) {
      b(f);
      return;
    }
    const m = () => {
      r(g), w && !w.persisted && w.afterLeave && w.afterLeave();
    };
    if (f.shapeFlag & 1 && w && !w.persisted) {
      const { leave: R, delayLeave: E } = w, A = () => R(g, m);
      E ? E(f.el, m, A) : A();
    } else
      m();
  }, $ = (f, h) => {
    let g;
    for (; f !== h; )
      g = v(f), r(f), f = g;
    r(h);
  }, D = (f, h, g) => {
    const { bum: S, scope: w, job: m, subTree: R, um: E, m: A, a: _ } = f;
    sr(A), sr(_), S && gs(S), w.stop(), m && (m.flags |= 8, Oe(R, f, h, g)), E && we(E, h), we(() => {
      f.isUnmounted = !0;
    }, h);
  }, ue = (f, h, g, S = !1, w = !1, m = 0) => {
    for (let R = m; R < f.length; R++)
      Oe(f[R], h, g, S, w);
  }, Qe = (f) => {
    if (f.shapeFlag & 6)
      return Qe(f.component.subTree);
    if (f.shapeFlag & 128)
      return f.suspense.next();
    const h = v(f.anchor || f.el), g = h && h[To];
    return g ? v(g) : h;
  };
  let Hs = !1;
  const Ln = (f, h, g) => {
    let S;
    f == null ? h._vnode && (Oe(h._vnode, null, null, !0), S = h._vnode.component) : O(
      h._vnode || null,
      f,
      h,
      null,
      null,
      null,
      g
    ), h._vnode = f, Hs || (Hs = !0, Kn(S), zr(), Hs = !1);
  }, Bt = {
    p: O,
    um: Oe,
    m: ze,
    r: L,
    mt: dt,
    mc: _e,
    pc: z,
    pbc: Me,
    n: Qe,
    o: e
  };
  return {
    render: Ln,
    hydrate: void 0,
    createApp: Go(Ln)
  };
}
function Qs({ type: e, props: t }, s) {
  return s === "svg" && e === "foreignObject" || s === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : s;
}
function mt({ effect: e, job: t }, s) {
  s ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function cl(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function _i(e, t, s = !1) {
  const n = e.children, r = t.children;
  if (V(n) && V(r))
    for (let i = 0; i < n.length; i++) {
      const l = n[i];
      let a = r[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = r[i] = et(r[i]), a.el = l.el), !s && a.patchFlag !== -2 && _i(l, a)), a.type === Vs && (a.patchFlag === -1 && (a = r[i] = et(a)), a.el = l.el), a.type === ut && !a.el && (a.el = l.el);
    }
}
function fl(e) {
  const t = e.slice(), s = [0];
  let n, r, i, l, a;
  const o = e.length;
  for (n = 0; n < o; n++) {
    const u = e[n];
    if (u !== 0) {
      if (r = s[s.length - 1], e[r] < u) {
        t[n] = r, s.push(n);
        continue;
      }
      for (i = 0, l = s.length - 1; i < l; )
        a = i + l >> 1, e[s[a]] < u ? i = a + 1 : l = a;
      u < e[s[i]] && (i > 0 && (t[n] = s[i - 1]), s[i] = n);
    }
  }
  for (i = s.length, l = s[i - 1]; i-- > 0; )
    s[i] = l, l = t[l];
  return s;
}
function wi(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : wi(t);
}
function sr(e) {
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
  t && t.pendingBranch ? V(e) ? t.effects.push(...e) : t.effects.push(e) : Co(e);
}
const te = /* @__PURE__ */ Symbol.for("v-fgt"), Vs = /* @__PURE__ */ Symbol.for("v-txt"), ut = /* @__PURE__ */ Symbol.for("v-cmt"), Xs = /* @__PURE__ */ Symbol.for("v-stc"), rt = [];
let Ee = null;
function C(e = !1) {
  rt.push(Ee = e ? null : []);
}
function In() {
  rt.pop(), Ee = rt[rt.length - 1] || null;
}
let rs = 1;
function nr(e, t = !1) {
  rs += e, e < 0 && Ee && t && (Ee.hasOnce = !0);
}
function Ai(e) {
  return e.dynamicChildren = rs > 0 ? Ee || It : null, In(), rs > 0 && Ee && Ee.push(e), e;
}
function T(e, t, s, n, r, i) {
  return Ai(
    d(
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
function xe(e, t, s, n, r) {
  return Ai(
    le(
      e,
      t,
      s,
      n,
      r,
      !0
    )
  );
}
function On(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function jt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const xi = ({ key: e }) => e ?? null, vs = ({
  ref: e,
  ref_key: t,
  ref_for: s
}) => (typeof e == "number" && (e = "" + e), e != null ? re(e) || /* @__PURE__ */ be(e) || j(e) ? { i: ge, r: e, k: t, f: !!s } : e : null);
function d(e, t = null, s = null, n = 0, r = null, i = e === te ? 0 : 1, l = !1, a = !1) {
  const o = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && xi(t),
    ref: t && vs(t),
    scopeId: Xr,
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
    ctx: ge
  };
  return a ? (As(o, s), i & 128 && e.normalize(o)) : s && (o.shapeFlag |= re(s) ? 8 : 16), rs > 0 && // avoid a block node from tracking itself
  !l && // has current parent block
  Ee && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (o.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  o.patchFlag !== 32 && Ee.push(o), o;
}
const le = hl;
function hl(e, t = null, s = null, n = 0, r = null, i = !1) {
  if ((!e || e === Vo) && (e = ut), On(e)) {
    const a = Lt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return s && As(a, s), rs > 0 && !i && Ee && (a.shapeFlag & 6 ? Ee[Ee.indexOf(e)] = a : Ee.push(a)), a.patchFlag = -2, a;
  }
  if (Cl(e) && (e = e.__vccOpts), t) {
    t = pl(t);
    let { class: a, style: o } = t;
    a && !re(a) && (t.class = xt(a)), X(o) && (/* @__PURE__ */ xn(o) && !V(o) && (o = ie({}, o)), t.style = bn(o));
  }
  const l = re(e) ? 1 : Ci(e) ? 128 : $o(e) ? 64 : X(e) ? 4 : j(e) ? 2 : 0;
  return d(
    e,
    t,
    s,
    n,
    r,
    l,
    i,
    !0
  );
}
function pl(e) {
  return e ? /* @__PURE__ */ xn(e) || pi(e) ? ie({}, e) : e : null;
}
function Lt(e, t, s = !1, n = !1) {
  const { props: r, ref: i, patchFlag: l, children: a, transition: o } = e, u = t ? gl(r || {}, t) : r, c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: u,
    key: u && xi(u),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      s && i ? V(i) ? i.concat(vs(t)) : [i, vs(t)] : vs(t)
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
    patchFlag: t && e.type !== te ? l === -1 ? 16 : l | 16 : l,
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
    ssContent: e.ssContent && Lt(e.ssContent),
    ssFallback: e.ssFallback && Lt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return o && n && Rn(
    c,
    o.clone(c)
  ), c;
}
function de(e = " ", t = 0) {
  return le(Vs, null, e, t);
}
function J(e = "", t = !1) {
  return t ? (C(), xe(ut, null, e)) : le(ut, null, e);
}
function qe(e) {
  return e == null || typeof e == "boolean" ? le(ut) : V(e) ? le(
    te,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : On(e) ? et(e) : le(Vs, null, String(e));
}
function et(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Lt(e);
}
function As(e, t) {
  let s = 0;
  const { shapeFlag: n } = e;
  if (t == null)
    t = null;
  else if (V(t))
    s = 16;
  else if (typeof t == "object")
    if (n & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), As(e, r()), r._c && (r._d = !0));
      return;
    } else {
      s = 32;
      const r = t._;
      !r && !pi(t) ? t._ctx = ge : r === 3 && ge && (ge.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (j(t)) {
    if (n & 65) {
      As(e, { default: t });
      return;
    }
    t = { default: t, _ctx: ge }, s = 32;
  } else
    t = String(t), n & 64 ? (s = 16, t = [de(t)]) : s = 8;
  e.children = t, e.shapeFlag |= s;
}
function gl(...e) {
  const t = {};
  for (let s = 0; s < e.length; s++) {
    const n = e[s];
    for (const r in n)
      if (r === "class")
        t.class !== n.class && (t.class = xt([t.class, n.class]));
      else if (r === "style")
        t.style = bn([t.style, n.style]);
      else if ($s(r)) {
        const i = t[r], l = n[r];
        l && i !== l && !(V(i) && i.includes(l)) ? t[r] = i ? [].concat(i, l) : l : l == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Is(r) && (t[r] = l);
      } else r !== "" && (t[r] = n[r]);
  }
  return t;
}
function He(e, t, s, n = null) {
  Ne(e, t, 7, [
    s,
    n
  ]);
}
const bl = ui();
let vl = 0;
function yl(e, t, s) {
  const n = e.type, r = (t ? t.appContext : e.appContext) || bl, i = {
    uid: vl++,
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
    propsOptions: bi(n, r),
    emitsOptions: ci(n, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: ee,
    // inheritAttrs
    inheritAttrs: n.inheritAttrs,
    // state
    ctx: ee,
    data: ee,
    props: ee,
    attrs: ee,
    slots: ee,
    refs: ee,
    setupState: ee,
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = zo.bind(null, i), e.ce && e.ce(i), i;
}
let me = null;
const Ei = () => me || ge;
let xs, fn;
{
  const e = Ms(), t = (s, n) => {
    let r;
    return (r = e[s]) || (r = e[s] = []), r.push(n), (i) => {
      r.length > 1 ? r.forEach((l) => l(i)) : r[0](i);
    };
  };
  xs = t(
    "__VUE_INSTANCE_SETTERS__",
    (s) => me = s
  ), fn = t(
    "__VUE_SSR_SETTERS__",
    (s) => is = s
  );
}
const cs = (e) => {
  const t = me;
  return xs(e), e.scope.on(), () => {
    e.scope.off(), xs(t);
  };
}, rr = () => {
  me && me.scope.off(), xs(null);
};
function Ri(e) {
  return e.vnode.shapeFlag & 4;
}
let is = !1;
function ml(e, t = !1, s = !1) {
  t && fn(t);
  const { props: n, children: r } = e.vnode, i = Ri(e);
  sl(e, n, i, t), ol(e, r, s || t);
  const l = i ? _l(e, t) : void 0;
  return t && fn(!1), l;
}
function _l(e, t) {
  const s = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Bo);
  const { setup: n } = s;
  if (n) {
    ot();
    const r = e.setupContext = n.length > 1 ? Sl(e) : null, i = cs(e), l = as(
      n,
      e,
      0,
      [
        e.props,
        r
      ]
    ), a = xr(l);
    if (lt(), i(), (a || e.sp) && !Pt(e) && si(e), a) {
      if (l.then(rr, rr), t)
        return l.then((o) => {
          ir(e, o);
        }).catch((o) => {
          Ls(o, e, 0);
        });
      e.asyncDep = l;
    } else
      ir(e, l);
  } else
    Ti(e);
}
function ir(e, t, s) {
  j(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : X(t) && (e.setupState = Wr(t)), Ti(e);
}
function Ti(e, t, s) {
  const n = e.type;
  e.render || (e.render = n.render || Ge);
  {
    const r = cs(e);
    ot();
    try {
      Fo(e);
    } finally {
      lt(), r();
    }
  }
}
const wl = {
  get(e, t) {
    return pe(e, "get", ""), e[t];
  }
};
function Sl(e) {
  const t = (s) => {
    e.exposed = s || {};
  };
  return {
    attrs: new Proxy(e.attrs, wl),
    slots: e.slots,
    emit: e.emit,
    expose: t
  };
}
function Bs(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Wr(ho(e.exposed)), {
    get(t, s) {
      if (s in t)
        return t[s];
      if (s in Xt)
        return Xt[s](e);
    },
    has(t, s) {
      return s in t || s in Xt;
    }
  })) : e.proxy;
}
function Cl(e) {
  return j(e) && "__vccOpts" in e;
}
const Dt = (e, t) => /* @__PURE__ */ yo(e, t, is), Al = "3.5.40";
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let dn;
const or = typeof window < "u" && window.trustedTypes;
if (or)
  try {
    dn = /* @__PURE__ */ or.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const $i = dn ? (e) => dn.createHTML(e) : (e) => e, xl = "http://www.w3.org/2000/svg", El = "http://www.w3.org/1998/Math/MathML", Ze = typeof document < "u" ? document : null, lr = Ze && /* @__PURE__ */ Ze.createElement("template"), Rl = {
  insert: (e, t, s) => {
    t.insertBefore(e, s || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, s, n) => {
    const r = t === "svg" ? Ze.createElementNS(xl, e) : t === "mathml" ? Ze.createElementNS(El, e) : s ? Ze.createElement(e, { is: s }) : Ze.createElement(e);
    return e === "select" && n && n.multiple != null && r.setAttribute("multiple", n.multiple), r;
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
  insertStaticContent(e, t, s, n, r, i) {
    const l = s ? s.previousSibling : t.lastChild;
    if (r && (r === i || r.nextSibling))
      for (; t.insertBefore(r.cloneNode(!0), s), !(r === i || !(r = r.nextSibling)); )
        ;
    else {
      lr.innerHTML = $i(
        n === "svg" ? `<svg>${e}</svg>` : n === "mathml" ? `<math>${e}</math>` : e
      );
      const a = lr.content;
      if (n === "svg" || n === "mathml") {
        const o = a.firstChild;
        for (; o.firstChild; )
          a.appendChild(o.firstChild);
        a.removeChild(o);
      }
      t.insertBefore(a, s);
    }
    return [
      // first
      l ? l.nextSibling : t.firstChild,
      // last
      s ? s.previousSibling : t.lastChild
    ];
  }
}, Tl = /* @__PURE__ */ Symbol("_vtc");
function $l(e, t, s) {
  const n = e[Tl];
  n && (t = (t ? [t, ...n] : [...n]).join(" ")), t == null ? e.removeAttribute("class") : s ? e.setAttribute("class", t) : e.className = t;
}
const Es = /* @__PURE__ */ Symbol("_vod"), Ii = /* @__PURE__ */ Symbol("_vsh"), Il = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: s }) {
    e[Es] = e.style.display === "none" ? "" : e.style.display, s && t ? s.beforeEnter(e) : Kt(e, t);
  },
  mounted(e, { value: t }, { transition: s }) {
    s && t && s.enter(e);
  },
  updated(e, { value: t, oldValue: s }, { transition: n }) {
    !t != !s && (n ? t ? (n.beforeEnter(e), Kt(e, !0), n.enter(e)) : n.leave(e, () => {
      Kt(e, !1);
    }) : Kt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    Kt(e, t);
  }
};
function Kt(e, t) {
  e.style.display = t ? e[Es] : "none", e[Ii] = !t;
}
const Ol = /* @__PURE__ */ Symbol(""), kl = /(?:^|;)\s*display\s*:/;
function Pl(e, t, s) {
  const n = e.style, r = re(s);
  let i = !1;
  if (s && !r) {
    if (t)
      if (re(t))
        for (const l of t.split(";")) {
          const a = l.slice(0, l.indexOf(":")).trim();
          s[a] == null && Wt(n, a, "");
        }
      else
        for (const l in t)
          s[l] == null && Wt(n, l, "");
    for (const l in s) {
      l === "display" && (i = !0);
      const a = s[l];
      a != null ? Ul(
        e,
        l,
        !re(t) && t ? t[l] : void 0,
        a
      ) || Wt(n, l, a) : Wt(n, l, "");
    }
  } else if (r) {
    if (t !== s) {
      const l = n[Ol];
      l && (s += ";" + l), n.cssText = s, i = kl.test(s);
    }
  } else t && e.removeAttribute("style");
  Es in e && (e[Es] = i ? n.display : "", e[Ii] && (n.display = "none"));
}
const ar = /\s*!important$/;
function Wt(e, t, s) {
  if (V(s))
    s.forEach((n) => Wt(e, t, n));
  else if (s == null && (s = ""), t.startsWith("--"))
    e.setProperty(t, s);
  else {
    const n = Ml(e, t);
    ar.test(s) ? e.setProperty(
      ke(n),
      s.replace(ar, ""),
      "important"
    ) : e[n] = s;
  }
}
const ur = ["Webkit", "Moz", "ms"], Zs = {};
function Ml(e, t) {
  const s = Zs[t];
  if (s)
    return s;
  let n = Ce(t);
  if (n !== "filter" && n in e)
    return Zs[t] = n;
  n = Rr(n);
  for (let r = 0; r < ur.length; r++) {
    const i = ur[r] + n;
    if (i in e)
      return Zs[t] = i;
  }
  return t;
}
function Ul(e, t, s, n) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && re(n) && s === n;
}
const cr = "http://www.w3.org/1999/xlink";
function fr(e, t, s, n, r, i = ji(t)) {
  n && t.startsWith("xlink:") ? s == null ? e.removeAttributeNS(cr, t.slice(6, t.length)) : e.setAttributeNS(cr, t, s) : s == null || i && !$r(s) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Le(s) ? String(s) : s
  );
}
function dr(e, t, s, n, r) {
  if (t === "innerHTML" || t === "textContent") {
    s != null && (e[t] = t === "innerHTML" ? $i(s) : s);
    return;
  }
  const i = e.tagName;
  if (t === "value" && i !== "PROGRESS" && // custom elements may use _value internally
  !i.includes("-")) {
    const a = i === "OPTION" ? e.getAttribute("value") || "" : e.value, o = s == null ? (
      // #11647: value should be set as empty string for null and undefined,
      // but <input type="checkbox"> should be set as 'on'.
      e.type === "checkbox" ? "on" : ""
    ) : String(s);
    (a !== o || !("_value" in e)) && (e.value = o), s == null && e.removeAttribute(t), e._value = s;
    return;
  }
  let l = !1;
  if (s === "" || s == null) {
    const a = typeof e[t];
    a === "boolean" ? s = $r(s) : s == null && a === "string" ? (s = "", l = !0) : a === "number" && (s = 0, l = !0);
  }
  try {
    e[t] = s;
  } catch {
  }
  l && e.removeAttribute(r || t);
}
function pt(e, t, s, n) {
  e.addEventListener(t, s, n);
}
function Ll(e, t, s, n) {
  e.removeEventListener(t, s, n);
}
const hr = /* @__PURE__ */ Symbol("_vei");
function Dl(e, t, s, n, r = null) {
  const i = e[hr] || (e[hr] = {}), l = i[t];
  if (n && l)
    l.value = n;
  else {
    const [a, o] = Vl(t);
    if (n) {
      const u = i[t] = Hl(
        n,
        r
      );
      pt(e, a, u, o);
    } else l && (Ll(e, a, l, o), i[t] = void 0);
  }
}
const Nl = /(Once|Passive|Capture)$/, Yl = /^on:?(?:Once|Passive|Capture)$/;
function Vl(e) {
  let t, s;
  for (; (s = e.match(Nl)) && !Yl.test(e); )
    t || (t = {}), e = e.slice(0, e.length - s[1].length), t[s[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : ke(e.slice(2)), t];
}
let en = 0;
const Bl = /* @__PURE__ */ Promise.resolve(), Fl = () => en || (Bl.then(() => en = 0), en = Date.now());
function Hl(e, t) {
  const s = (n) => {
    if (!n._vts)
      n._vts = Date.now();
    else if (n._vts <= s.attached)
      return;
    const r = s.value;
    if (V(r)) {
      const i = n.stopImmediatePropagation;
      n.stopImmediatePropagation = () => {
        i.call(n), n._stopped = !0;
      };
      const l = r.slice(), a = [n];
      for (let o = 0; o < l.length && !n._stopped; o++) {
        const u = l[o];
        u && Ne(
          u,
          t,
          5,
          a
        );
      }
    } else
      Ne(
        r,
        t,
        5,
        [n]
      );
  };
  return s.value = e, s.attached = Fl(), s;
}
const pr = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, jl = (e, t, s, n, r, i) => {
  const l = r === "svg";
  t === "class" ? $l(e, n, l) : t === "style" ? Pl(e, s, n) : $s(t) ? Is(t) || Dl(e, t, s, n, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Kl(e, t, n, l)) ? (dr(e, t, n), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && fr(e, t, n, l, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (ql(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !re(n))) ? dr(e, Ce(t), n, i, t) : (t === "true-value" ? e._trueValue = n : t === "false-value" && (e._falseValue = n), fr(e, t, n, l));
};
function Kl(e, t, s, n) {
  if (n)
    return !!(t === "innerHTML" || t === "textContent" || t in e && pr(t) && j(s));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return pr(t) && re(s) ? !1 : t in e;
}
function ql(e, t) {
  const s = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!s)
    return !1;
  const n = Ce(t);
  return Array.isArray(s) ? s.some((r) => Ce(r) === n) : Object.keys(s).some((r) => Ce(r) === n);
}
const gr = {};
// @__NO_SIDE_EFFECTS__
function Wl(e, t, s) {
  let n = /* @__PURE__ */ Re(e, t);
  Os(n) && (n = ie({}, n, t));
  class r extends kn {
    constructor(l) {
      super(n, l, s);
    }
  }
  return r.def = n, r;
}
const Gl = typeof HTMLElement < "u" ? HTMLElement : class {
};
class kn extends Gl {
  constructor(t, s = {}, n = wr) {
    super(), this._def = t, this._props = s, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== wr ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
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
      if (t instanceof kn) {
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
    this._connected = !1, us(() => {
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
      const { props: i, styles: l } = n;
      let a;
      if (i && !V(i))
        for (const o in i) {
          const u = i[o];
          (u === Number || u && u.type === Number) && (o in this._props && (this._props[o] = Bn(this._props[o])), (a || (a = /* @__PURE__ */ Object.create(null)))[Ce(o)] = !0);
        }
      this._numberProps = a, this._resolveProps(n), this.shadowRoot && this._applyStyles(l), this._mount(n);
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
        W(this, n) || Object.defineProperty(this, n, {
          // unwrap ref to be consistent with public instance behavior
          get: () => qr(s[n])
        });
  }
  _resolveProps(t) {
    const { props: s } = t, n = V(s) ? s : Object.keys(s || {});
    for (const r of Object.keys(this))
      r[0] !== "_" && n.includes(r) && this._setProp(r, this[r]);
    for (const r of n.map(Ce))
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
    let n = s ? this.getAttribute(t) : gr;
    const r = Ce(t);
    s && this._numberProps && this._numberProps[r] && (n = Bn(n)), this._setProp(r, n, !1, !0);
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
    if (s !== this._props[t] && (this._dirty = !0, s === gr ? delete this._props[t] : (this._props[t] = s, t === "key" && this._app && (this._app._ceVNode.key = s)), r && this._instance && this._update(), n)) {
      const i = this._ob;
      i && (this._processMutations(i.takeRecords()), i.disconnect()), s === !0 ? this.setAttribute(ke(t), "") : typeof s == "string" || typeof s == "number" ? this.setAttribute(ke(t), s + "") : s || this.removeAttribute(ke(t)), i && i.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), Zl(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const s = le(this._def, ie(t, this._props));
    return this._instance || (s.ce = (n) => {
      this._instance = n, n.ce = this, n.isCE = !0;
      const r = (i, l) => {
        this.dispatchEvent(
          new CustomEvent(
            i,
            Os(l[0]) ? ie({ detail: l }, l[0]) : { detail: l }
          )
        );
      };
      n.emit = (i, ...l) => {
        r(i, l), ke(i) !== i && r(ke(i), l);
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
    const r = this._nonce, i = this.shadowRoot, l = n ? this._getStyleAnchor(n) || this._getStyleAnchor(this._def) : this._getRootStyleInsertionAnchor(i);
    let a = null;
    for (let o = t.length - 1; o >= 0; o--) {
      const u = document.createElement("style");
      r && u.setAttribute("nonce", r), u.textContent = t[o], i.insertBefore(u, a || l), a = u, o === 0 && (n || this._styleAnchors.set(this._def, u), s && this._styleAnchors.set(s, u));
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
      const r = t[n], i = r.getAttribute("name") || "default", l = this._slots[i], a = r.parentNode;
      if (l)
        for (const o of l) {
          if (s && o.nodeType === 1) {
            const u = s + "-s", c = document.createTreeWalker(o, 1);
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
const Nt = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return V(t) ? (s) => gs(t, s) : t;
};
function Jl(e) {
  e.target.composing = !0;
}
function br(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const it = /* @__PURE__ */ Symbol("_assign");
function vr(e, t, s) {
  return t && (e = e.trim()), s && (e = Ps(e)), e;
}
const zl = {
  created(e, { modifiers: { lazy: t, trim: s, number: n } }, r) {
    e[it] = Nt(r);
    const i = n || r.props && r.props.type === "number";
    pt(e, t ? "change" : "input", (l) => {
      l.target.composing || e[it](vr(e.value, s, i));
    }), (s || i) && pt(e, "change", () => {
      e.value = vr(e.value, s, i);
    }), t || (pt(e, "compositionstart", Jl), pt(e, "compositionend", br), pt(e, "change", br));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: s, modifiers: { lazy: n, trim: r, number: i } }, l) {
    if (e[it] = Nt(l), e.composing) return;
    const a = (i || e.type === "number") && !/^0\d/.test(e.value) ? Ps(e.value) : e.value, o = t ?? "";
    if (a === o)
      return;
    const u = e.getRootNode();
    (u instanceof Document || u instanceof ShadowRoot) && u.activeElement === e && e.type !== "range" && (n && t === s || r && e.value.trim() === o) || (e.value = o);
  }
}, Rs = {
  // #4096 array checkboxes need to be deep traversed
  deep: !0,
  created(e, t, s) {
    e[it] = Nt(s), pt(e, "change", () => {
      const n = e._modelValue, r = os(e), i = e.checked, l = e[it];
      if (V(n)) {
        const a = vn(n, r), o = a !== -1;
        if (i && !o)
          l(n.concat(r));
        else if (!i && o) {
          const u = [...n];
          u.splice(a, 1), l(u);
        }
      } else if (Yt(n)) {
        const a = new Set(n);
        i ? a.add(r) : a.delete(r), l(a);
      } else
        l(Oi(e, i));
    });
  },
  // set initial checked on mount to wait for true-value/false-value
  mounted: yr,
  beforeUpdate(e, t, s) {
    e[it] = Nt(s), yr(e, t, s);
  }
};
function yr(e, { value: t, oldValue: s }, n) {
  e._modelValue = t;
  let r;
  if (V(t))
    r = vn(t, n.props.value) > -1;
  else if (Yt(t))
    r = t.has(n.props.value);
  else {
    if (t === s) return;
    r = Vt(t, Oi(e, !0));
  }
  e.checked !== r && (e.checked = r);
}
const Ql = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: s } }, n) {
    e._modelValue = t, pt(e, "change", () => {
      const r = Array.prototype.filter.call(e.options, (i) => i.selected).map(
        (i) => s ? Ps(os(i)) : os(i)
      );
      e[it](
        e.multiple ? Yt(e._modelValue) ? new Set(r) : r : r[0]
      ), e._assigning = !0, us(() => {
        e._assigning = !1;
      });
    }), e[it] = Nt(n);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    mr(e, t);
  },
  beforeUpdate(e, { value: t }, s) {
    e._modelValue = t, e[it] = Nt(s);
  },
  updated(e, { value: t }) {
    e._assigning || mr(e, t);
  }
};
function mr(e, t) {
  const s = e.multiple, n = V(t);
  if (!(s && !n && !Yt(t))) {
    for (let r = 0, i = e.options.length; r < i; r++) {
      const l = e.options[r], a = os(l);
      if (s)
        if (n) {
          const o = typeof a;
          o === "string" || o === "number" ? l.selected = t.some((u) => String(u) === String(a)) : l.selected = vn(t, a) > -1;
        } else
          l.selected = t.has(a);
      else if (Vt(os(l), t)) {
        e.selectedIndex !== r && (e.selectedIndex = r);
        return;
      }
    }
    !s && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function os(e) {
  return "_value" in e ? e._value : e.value;
}
function Oi(e, t) {
  const s = t ? "_trueValue" : "_falseValue";
  return s in e ? e[s] : t;
}
const Xl = /* @__PURE__ */ ie({ patchProp: jl }, Rl);
let _r;
function ki() {
  return _r || (_r = al(Xl));
}
const Zl = ((...e) => {
  ki().render(...e);
}), wr = ((...e) => {
  const t = ki().createApp(...e), { mount: s } = t;
  return t.mount = (n) => {
    const r = ta(n);
    if (!r) return;
    const i = t._component;
    !j(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
    const l = s(r, !1, ea(r));
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
const sa = 8e3, na = 2e3, Sr = 1e6, Se = "Unable to complete this request.", Cr = "Request timed out.", Zt = "Request cancelled.", Pi = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Mi = `
  plugin { enabled dashboardWidgetEnable bindMode customHost port authMode tailscaleServe tailscaleHostname logLevel updateChannel }
  services { service enabled baseUrl username hasPassword hasApiKey extra { key value } }
`, Pn = `
  config { ${Mi} }
  changed restarted rolledBack error
`, ra = `query YarrRuntime { yarrRuntime { ${Pi} } }`, ia = `query YarrConfig { yarrConfig { ${Mi} } }`, oa = `mutation SaveYarrConfig($input: SaveYarrConfigInput!) {
  saveYarrConfig(input: $input) { ${Pn} }
}`, la = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${Pi} }
}`, aa = `query YarrDiscoveredServices {
  yarrDiscoveredServices {
    discoveryId
    candidates { candidateId source serviceId confidence reasons baseUrl hasCredential }
    errors { code message }
  }
}`, ua = `query YarrLogs($lines: Int) {
  yarrLogs(lines: $lines) { lines truncated }
}`, Fs = `
  installedVersion packagedVersion availableVersion updateAvailable usingOverlay rollbackAvailable rolledBack message
`, ca = `query YarrUpdateStatus { yarrUpdateStatus { ${Fs} } }`, fa = `mutation PreviewYarrImport($input: PreviewYarrImportInput!) {
  previewYarrImport(input: $input) {
    previewId mappings { serviceId baseUrl hasUsername hasPassword hasApiKey urlRequired } warnings
  }
}`, da = `mutation ApplyYarrImport($input: ApplyYarrImportInput!) {
  applyYarrImport(input: $input) { ${Pn} }
}`, ha = `mutation ApplyYarrDiscovery($input: ApplyYarrDiscoveryInput!) {
  applyYarrDiscovery(input: $input) { ${Pn} }
}`, pa = `mutation UpdateYarrBinary($version: String!) {
  updateYarrBinary(version: $version) { ${Fs} }
}`, ga = `mutation ResetYarrBinary {
  resetYarrBinary { ${Fs} }
}`, ba = `mutation RollbackYarrBinary {
  rollbackYarrBinary { ${Fs} }
}`;
function Mn(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function es(e) {
  return new DOMException(e, "AbortError");
}
async function va(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw es(Zt);
    return;
  }
  await new Promise((t, s) => {
    const n = window.setInterval(() => {
      window.csrf_token && l(t);
    }, 20), r = window.setTimeout(() => l(t), na), i = () => l(() => s(es(Zt))), l = (a) => {
      window.clearInterval(n), window.clearTimeout(r), e.removeEventListener("abort", i), a();
    };
    e.addEventListener("abort", i, { once: !0 });
  });
}
async function ya(e) {
  const t = e.body;
  if (!t) throw new Error(Se);
  const s = e.headers.get("content-length");
  if (s && /^(?:0|[1-9]\d*)$/.test(s)) {
    const o = Number(s);
    if (Number.isSafeInteger(o) && o > Sr) {
      try {
        await t.cancel();
      } catch {
      }
      throw new Error(Se);
    }
  }
  const n = t.getReader(), r = [];
  let i = 0;
  try {
    for (; ; ) {
      const { done: o, value: u } = await n.read();
      if (o) break;
      if (i += u.byteLength, i > Sr) {
        try {
          await n.cancel();
        } catch {
        }
        throw new Error(Se);
      }
      r.push(u);
    }
  } catch (o) {
    throw o instanceof Error && o.message === Se ? o : new Error(Se);
  } finally {
    n.releaseLock();
  }
  const l = new Uint8Array(i);
  let a = 0;
  for (const o of r)
    l.set(o, a), a += o.byteLength;
  try {
    const o = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(l));
    if (!Mn(o)) throw new Error(Se);
    return o;
  } catch {
    throw new Error(Se);
  }
}
async function ma(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function Te(e, t, s) {
  const n = new AbortController();
  let r = !1, i = !1;
  const l = window.setTimeout(() => {
    r = !0, n.abort(es(Cr));
  }, sa), a = () => n.abort(es(Zt));
  s != null && s.aborted ? a() : s == null || s.addEventListener("abort", a, { once: !0 });
  try {
    if (await va(n.signal), n.signal.aborted) throw es(Zt);
    const o = await fetch("/graphql", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": window.csrf_token ?? ""
      },
      body: JSON.stringify({ query: e, variables: t }),
      signal: n.signal
    });
    if (!o.ok)
      throw i = !0, await ma(o.body), n.abort(), new Error(Se);
    const u = await ya(o);
    if (Array.isArray(u.errors) && u.errors.length > 0) throw new Error(Se);
    if (!Mn(u.data)) throw new Error(Se);
    return u.data;
  } catch (o) {
    throw r ? new Error(Cr) : i ? new Error(Se) : n.signal.aborted ? new Error(Zt) : o instanceof Error && o.message === Se ? o : new Error(Se);
  } finally {
    window.clearTimeout(l), s == null || s.removeEventListener("abort", a);
  }
}
function $e(e, t) {
  const s = e[t];
  if (!Mn(s)) throw new Error(Se);
  return s;
}
async function _a(e) {
  return $e(await Te(ra, void 0, e), "yarrRuntime");
}
async function wa(e) {
  return $e(await Te(ia, void 0, e), "yarrConfig");
}
async function Sa(e, t) {
  return $e(
    await Te(oa, { input: e }, t),
    "saveYarrConfig"
  );
}
async function Ca(e, t) {
  return $e(
    await Te(la, { action: e }, t),
    "controlYarr"
  );
}
async function Aa(e) {
  return $e(
    await Te(aa, void 0, e),
    "yarrDiscoveredServices"
  );
}
async function xa(e, t) {
  const s = Math.max(1, Math.min(500, Math.trunc(e)));
  return $e(
    await Te(ua, { lines: s }, t),
    "yarrLogs"
  );
}
async function Ea(e) {
  return $e(
    await Te(ca, void 0, e),
    "yarrUpdateStatus"
  );
}
async function Ra(e, t) {
  return $e(
    await Te(fa, { input: { text: e } }, t),
    "previewYarrImport"
  );
}
async function Ta(e, t) {
  return $e(
    await Te(da, { input: e }, t),
    "applyYarrImport"
  );
}
async function $a(e, t) {
  return $e(
    await Te(ha, { input: e }, t),
    "applyYarrDiscovery"
  );
}
async function Ia(e, t) {
  return $e(
    await Te(pa, { version: e }, t),
    "updateYarrBinary"
  );
}
async function Oa(e) {
  return $e(
    await Te(ga, void 0, e),
    "resetYarrBinary"
  );
}
async function ka(e) {
  return $e(
    await Te(ba, void 0, e),
    "rollbackYarrBinary"
  );
}
const Pa = {
  key: 0,
  class: "yarr-dialog-backdrop"
}, Ma = ["aria-busy"], Ua = { class: "yarr-dialog__header" }, La = ["disabled"], Da = { class: "yarr-dialog__body" }, Na = {
  key: 0,
  class: "yarr-dialog__footer"
}, Ya = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", Un = /* @__PURE__ */ Re({
  __name: "AccessibleDialog",
  props: {
    open: { type: Boolean },
    title: {},
    busy: { type: Boolean, default: !1 }
  },
  emits: ["close"],
  setup(e, { emit: t }) {
    const s = e, n = t, r = /* @__PURE__ */ H(), i = `yarr-dialog-${ti()}`;
    let l = null;
    function a(y) {
      if (y.hasAttribute("disabled") || y.getAttribute("aria-disabled") === "true" || y.hidden || y.closest("[hidden]")) return !1;
      const k = window.getComputedStyle(y);
      return k.display !== "none" && k.visibility !== "hidden";
    }
    function o() {
      var y;
      return [...((y = r.value) == null ? void 0 : y.querySelectorAll(Ya)) ?? []].filter(a);
    }
    function u() {
      var k;
      const y = (k = r.value) == null ? void 0 : k.querySelector("[data-autofocus]");
      return y && a(y) ? y : o()[0] ?? r.value;
    }
    function c(y) {
      var U, K;
      if (y.key === "Escape" && !s.busy) {
        y.preventDefault(), n("close");
        return;
      }
      if (y.key !== "Tab" || !s.open) return;
      const k = o();
      if (k.length === 0) {
        y.preventDefault(), (U = r.value) == null || U.focus();
        return;
      }
      const O = document.activeElement instanceof HTMLElement ? k.indexOf(document.activeElement) : -1;
      y.shiftKey && O <= 0 ? (y.preventDefault(), (K = k.at(-1)) == null || K.focus()) : !y.shiftKey && (O === -1 || O === k.length - 1) && (y.preventDefault(), k[0].focus());
    }
    function p(y) {
      var k;
      !s.open || !r.value || r.value.contains(y.target) || (k = u()) == null || k.focus();
    }
    function v() {
      document.removeEventListener("keydown", c), document.removeEventListener("focusin", p);
    }
    return Je(() => s.open, async (y) => {
      var k;
      if (v(), !y) {
        l == null || l.focus(), l = null;
        return;
      }
      l = document.activeElement instanceof HTMLElement ? document.activeElement : null, document.addEventListener("keydown", c), document.addEventListener("focusin", p), await us(), (k = u()) == null || k.focus();
    }, { immediate: !0 }), Et(() => {
      v(), l == null || l.focus();
    }), (y, k) => e.open ? (C(), T("div", Pa, [
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
        d("header", Ua, [
          d("h2", { id: i }, M(e.title), 1),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            "aria-label": "Close dialog",
            onClick: k[0] || (k[0] = (O) => n("close"))
          }, "Close", 8, La)
        ]),
        d("div", Da, [
          Gn(y.$slots, "default")
        ]),
        y.$slots.footer ? (C(), T("footer", Na, [
          Gn(y.$slots, "footer")
        ])) : J("", !0)
      ], 8, Ma)
    ])) : J("", !0);
  }
}), Va = {
  key: 0,
  role: "status"
}, Ba = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, Fa = ["disabled"], Ha = {
  key: 0,
  class: "yarr-warning-list"
}, ja = {
  key: 1,
  class: "yarr-empty"
}, Ka = ["name", "value", "disabled"], qa = ["onUpdate:modelValue", "disabled"], Wa = ["disabled"], Ga = ["disabled"], Ja = /* @__PURE__ */ Re({
  __name: "DiscoveryDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const s = e, n = t, r = /* @__PURE__ */ H(), i = /* @__PURE__ */ H([]), l = /* @__PURE__ */ H({}), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H("");
    let u, c = 0;
    const p = Dt(() => i.value.length > 0 && !a.value);
    function v(x) {
      return x === "sabnzbd" ? "SABnzbd" : x === "qbittorrent" ? "qBittorrent" : x.charAt(0).toUpperCase() + x.slice(1);
    }
    function y() {
      c += 1, u == null || u.abort(), r.value = void 0, i.value = [], l.value = {}, a.value = !1, o.value = "";
    }
    function k() {
      y(), n("close");
    }
    async function O() {
      u == null || u.abort(), u = new AbortController();
      const x = ++c;
      a.value = !0, o.value = "";
      try {
        const P = await Aa(u.signal);
        x === c && (r.value = P);
      } catch {
        x === c && !u.signal.aborted && (o.value = "Docker discovery failed. Confirm the read-only Docker socket is available, then retry.");
      } finally {
        x === c && (a.value = !1);
      }
    }
    async function U() {
      if (!r.value || i.value.length === 0) return;
      u == null || u.abort(), u = new AbortController(), a.value = !0, o.value = "";
      const x = r.value.candidates.filter((b) => i.value.includes(b.candidateId)), P = [...new Set(x.map((b) => b.serviceId))];
      try {
        const b = await $a({
          discoveryId: r.value.discoveryId,
          selectedCandidateIds: [...i.value],
          credentialConsent: P.map((B) => ({ serviceId: B, consent: l.value[B] === !0 }))
        }, u.signal);
        y(), n("applied", b), n("close");
      } catch {
        u.signal.aborted || (o.value = "Discovery apply result was not confirmed. Refresh current configuration before retrying."), a.value = !1;
      }
    }
    function K(x) {
      var P;
      return ((P = r.value) == null ? void 0 : P.candidates.some((b) => b.serviceId === x && i.value.includes(b.candidateId))) === !0;
    }
    return Je(() => s.open, (x) => {
      x ? (y(), O()) : y();
    }), Je(a, (x) => n("busy", x)), Et(y), (x, P) => (C(), xe(Un, {
      open: e.open,
      title: "Discover Docker services",
      busy: a.value,
      onClose: k
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: a.value,
          onClick: k
        }, "Cancel", 8, Wa),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: U
        }, M(a.value ? "Applying..." : "Apply selected"), 9, Ga)
      ]),
      default: At(() => [
        P[2] || (P[2] = d("p", null, "Yarr reads bounded container identity and endpoint metadata. Select each candidate explicitly.", -1)),
        a.value && !r.value ? (C(), T("p", Va, "Inspecting Docker services...")) : J("", !0),
        o.value ? (C(), T("div", Ba, [
          d("p", null, M(o.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: a.value,
            onClick: O
          }, "Retry discovery", 8, Fa)
        ])) : J("", !0),
        r.value ? (C(), T(te, { key: 2 }, [
          r.value.errors.length ? (C(), T("ul", Ha, [
            (C(!0), T(te, null, nt(r.value.errors, (b) => (C(), T("li", {
              key: b.code
            }, [
              d("strong", null, M(b.code), 1),
              de(": " + M(b.message), 1)
            ]))), 128))
          ])) : J("", !0),
          r.value.candidates.length === 0 ? (C(), T("p", ja, "No supported Docker services were found.")) : J("", !0),
          (C(!0), T(te, null, nt(r.value.candidates, (b) => (C(), T("fieldset", {
            key: b.candidateId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              Ct(d("input", {
                "onUpdate:modelValue": P[0] || (P[0] = (B) => i.value = B),
                type: "checkbox",
                name: `discovery-candidate-${b.candidateId}`,
                value: b.candidateId,
                disabled: a.value
              }, null, 8, Ka), [
                [Rs, i.value]
              ]),
              P[1] || (P[1] = de()),
              d("strong", null, M(v(b.serviceId)), 1)
            ]),
            d("span", null, M(b.baseUrl) + " · " + M(b.confidence) + "% confidence", 1),
            d("small", null, M(b.reasons.join("; ")), 1)
          ]))), 128)),
          (C(!0), T(te, null, nt([...new Set(r.value.candidates.filter((b) => b.hasCredential).map((b) => b.serviceId))], (b) => Ct((C(), T("label", {
            key: b,
            class: "yarr-consent-row"
          }, [
            Ct(d("input", {
              "onUpdate:modelValue": (B) => l.value[b] = B,
              type: "checkbox",
              disabled: a.value
            }, null, 8, qa), [
              [Rs, l.value[b]]
            ]),
            de(" Import credentials for " + M(v(b)), 1)
          ])), [
            [Il, K(b)]
          ])), 128))
        ], 64)) : J("", !0)
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), za = {
  key: 0,
  class: "yarr-dialog-flow"
}, Qa = ["disabled"], Xa = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Za = {
  key: 1,
  class: "yarr-dialog-flow"
}, eu = {
  key: 0,
  class: "yarr-warning-list"
}, tu = ["name", "value", "disabled"], su = { key: 0 }, nu = {
  key: 1,
  class: "yarr-error"
}, ru = { key: 2 }, iu = { key: 3 }, ou = ["onUpdate:modelValue", "disabled"], lu = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, au = ["disabled"], uu = ["disabled"], cu = ["disabled"], fu = /* @__PURE__ */ Re({
  __name: "ImportDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const s = e, n = t, r = /* @__PURE__ */ H(""), i = /* @__PURE__ */ H(), l = /* @__PURE__ */ H([]), a = /* @__PURE__ */ H({}), o = /* @__PURE__ */ H(!1), u = /* @__PURE__ */ H("");
    let c;
    const p = Dt(
      () => l.value.length > 0 && !o.value && l.value.every(
        (x) => {
          var P;
          return ((P = i.value) == null ? void 0 : P.mappings.some((b) => b.serviceId === x && !b.urlRequired)) === !0;
        }
      )
    );
    function v() {
      c == null || c.abort(), r.value = "", i.value = void 0, l.value = [], a.value = {}, o.value = !1, u.value = "";
    }
    function y() {
      v(), n("close");
    }
    function k(x) {
      return x === "sabnzbd" ? "SABnzbd" : x === "qbittorrent" ? "qBittorrent" : x.charAt(0).toUpperCase() + x.slice(1);
    }
    function O(x) {
      return x.hasUsername || x.hasPassword || x.hasApiKey;
    }
    async function U() {
      if (r.value.trim() === "") {
        u.value = "Paste .env assignments or Yarr TOML before requesting a preview.";
        return;
      }
      c == null || c.abort(), c = new AbortController(), o.value = !0, u.value = "";
      const x = r.value;
      try {
        i.value = await Ra(x, c.signal), r.value = "", l.value = [], a.value = {};
      } catch {
        c.signal.aborted || (u.value = "Import preview failed. Check the format and retry; no settings were applied.");
      } finally {
        o.value = !1;
      }
    }
    async function K() {
      if (!(!i.value || !p.value)) {
        c == null || c.abort(), c = new AbortController(), o.value = !0, u.value = "";
        try {
          const x = await Ta({
            previewId: i.value.previewId,
            selectedServiceIds: [...l.value],
            credentialConsent: l.value.map((P) => ({ serviceId: P, consent: a.value[P] === !0 }))
          }, c.signal);
          v(), n("applied", x), n("close");
        } catch {
          c.signal.aborted || (u.value = "Import result was not confirmed. Refresh current configuration before retrying."), o.value = !1;
        }
      }
    }
    return Je(() => s.open, (x) => {
      x ? v() : r.value = "";
    }), Je(o, (x) => n("busy", x)), Et(v), (x, P) => (C(), xe(Un, {
      open: e.open,
      title: "Import configuration",
      busy: o.value,
      onClose: y
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: o.value,
          onClick: y
        }, "Cancel", 8, au),
        i.value ? (C(), T("button", {
          key: 1,
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: K
        }, M(o.value ? "Applying..." : "Apply selected"), 9, cu)) : (C(), T("button", {
          key: 0,
          type: "button",
          class: "yarr-button",
          disabled: o.value || r.value.trim() === "",
          onClick: U
        }, M(o.value ? "Previewing..." : "Preview import"), 9, uu))
      ]),
      default: At(() => [
        i.value ? (C(), T("div", Za, [
          P[5] || (P[5] = d("p", null, "Select at least one service. Credential permission is separate for each selected service.", -1)),
          i.value.warnings.length ? (C(), T("ul", eu, [
            (C(!0), T(te, null, nt(i.value.warnings, (b) => (C(), T("li", { key: b }, M(b), 1))), 128))
          ])) : J("", !0),
          (C(!0), T(te, null, nt(i.value.mappings, (b) => (C(), T("fieldset", {
            key: b.serviceId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              Ct(d("input", {
                "onUpdate:modelValue": P[1] || (P[1] = (B) => l.value = B),
                type: "checkbox",
                name: `import-service-${b.serviceId}`,
                value: b.serviceId,
                disabled: o.value || b.urlRequired
              }, null, 8, tu), [
                [Rs, l.value]
              ]),
              P[4] || (P[4] = de()),
              d("strong", null, M(k(b.serviceId)), 1)
            ]),
            b.baseUrl ? (C(), T("span", su, M(b.baseUrl), 1)) : b.urlRequired ? (C(), T("span", nu, "URL required before this service can be imported.")) : (C(), T("span", ru, "Uses the existing configured URL.")),
            l.value.includes(b.serviceId) && O(b) ? (C(), T("label", iu, [
              Ct(d("input", {
                "onUpdate:modelValue": (B) => a.value[b.serviceId] = B,
                type: "checkbox",
                disabled: o.value
              }, null, 8, ou), [
                [Rs, a.value[b.serviceId]]
              ]),
              de(" Import credentials for " + M(k(b.serviceId)), 1)
            ])) : J("", !0)
          ]))), 128)),
          u.value ? (C(), T("p", lu, M(u.value), 1)) : J("", !0)
        ])) : (C(), T("div", za, [
          P[3] || (P[3] = d("p", null, "Paste .env assignments or Yarr TOML. Yarr returns only mapped service metadata and warnings, never values.", -1)),
          d("label", null, [
            P[2] || (P[2] = de("Paste .env or Yarr TOML", -1)),
            Ct(d("textarea", {
              "onUpdate:modelValue": P[0] || (P[0] = (b) => r.value = b),
              rows: "9",
              disabled: o.value,
              autocomplete: "off",
              spellcheck: "false"
            }, null, 8, Qa), [
              [zl, r.value]
            ])
          ]),
          u.value ? (C(), T("p", Xa, M(u.value), 1)) : J("", !0)
        ]))
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), du = ["aria-busy"], hu = { class: "yarr-section-heading" }, pu = { class: "yarr-actions" }, gu = ["disabled"], bu = ["disabled"], vu = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, yu = ["disabled"], mu = {
  key: 1,
  role: "status"
}, _u = {
  key: 0,
  class: "yarr-note"
}, wu = {
  class: "yarr-log",
  "aria-label": "Yarr log output"
}, Su = /* @__PURE__ */ Re({
  __name: "LogsPanel",
  setup(e) {
    const t = /* @__PURE__ */ H(200), s = /* @__PURE__ */ H(), n = /* @__PURE__ */ H(!1), r = /* @__PURE__ */ H("");
    let i, l = 0;
    async function a() {
      i == null || i.abort(), i = new AbortController();
      const o = ++l;
      n.value = !0, r.value = "";
      try {
        const u = await xa(Math.max(1, Math.min(500, t.value)), i.signal);
        o === l && (s.value = u);
      } catch {
        o === l && !i.signal.aborted && (r.value = "Logs could not be loaded. Confirm Yarr is installed and retry.");
      } finally {
        o === l && (n.value = !1);
      }
    }
    return Ns(a), Et(() => {
      l += 1, i == null || i.abort();
    }), (o, u) => (C(), T("section", {
      class: "yarr-panel",
      "aria-labelledby": "logs-heading",
      "aria-busy": n.value
    }, [
      d("div", hu, [
        u[3] || (u[3] = d("div", null, [
          d("h2", { id: "logs-heading" }, "Logs"),
          d("p", null, "Read a bounded tail of the redacted Yarr log.")
        ], -1)),
        d("div", pu, [
          d("label", null, [
            u[2] || (u[2] = de("Lines", -1)),
            Ct(d("select", {
              "onUpdate:modelValue": u[0] || (u[0] = (c) => t.value = c),
              disabled: n.value
            }, [...u[1] || (u[1] = [
              d("option", { value: 100 }, "100", -1),
              d("option", { value: 200 }, "200", -1),
              d("option", { value: 500 }, "500", -1)
            ])], 8, gu), [
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
            disabled: n.value,
            onClick: a
          }, "Refresh logs", 8, bu)
        ])
      ]),
      r.value ? (C(), T("div", vu, [
        d("p", null, M(r.value), 1),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: n.value,
          onClick: a
        }, "Retry log request", 8, yu)
      ])) : s.value ? (C(), T(te, { key: 2 }, [
        s.value.truncated ? (C(), T("p", _u, "Older lines were omitted. Increase the bounded line count if needed.")) : J("", !0),
        d("pre", wu, [
          (C(!0), T(te, null, nt(s.value.lines, (c, p) => (C(), T("span", { key: p }, M(c) + M(`
`), 1))), 128))
        ])
      ], 64)) : (C(), T("p", mu, "Loading logs..."))
    ], 8, du));
  }
}), Cu = {
  class: "yarr-panel",
  "aria-labelledby": "overview-heading"
}, Au = { class: "yarr-section-heading" }, xu = { class: "yarr-actions" }, Eu = ["disabled"], Ru = ["disabled"], Tu = ["disabled"], $u = { class: "yarr-detail-list" }, Iu = { class: "yarr-operation-row" }, Ou = { class: "yarr-actions" }, ku = ["disabled"], Pu = ["disabled"], Mu = /* @__PURE__ */ Re({
  __name: "OverviewPanel",
  props: {
    runtime: {},
    config: {},
    busy: { type: Boolean }
  },
  emits: ["control", "import", "discover"],
  setup(e, { emit: t }) {
    const s = t;
    return (n, r) => (C(), T("section", Cu, [
      d("div", Au, [
        d("div", null, [
          r[5] || (r[5] = d("h2", { id: "overview-heading" }, "Current operation", -1)),
          d("p", null, M(e.runtime.healthMessage), 1)
        ]),
        d("div", xu, [
          e.runtime.state !== "running" ? (C(), T("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[0] || (r[0] = (i) => s("control", "START"))
          }, "Start Yarr", 8, Eu)) : (C(), T("button", {
            key: 1,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[1] || (r[1] = (i) => s("control", "RESTART"))
          }, "Restart Yarr", 8, Ru)),
          e.runtime.state === "running" ? (C(), T("button", {
            key: 2,
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[2] || (r[2] = (i) => s("control", "STOP"))
          }, "Stop Yarr", 8, Tu)) : J("", !0)
        ])
      ]),
      d("dl", $u, [
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
      d("div", Iu, [
        r[10] || (r[10] = d("div", null, [
          d("h3", null, "Bring in existing services"),
          d("p", null, "Preview environment settings or inspect Docker metadata before choosing what Yarr may apply.")
        ], -1)),
        d("div", Ou, [
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[3] || (r[3] = (i) => s("import"))
          }, "Import configuration", 8, ku),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[4] || (r[4] = (i) => s("discover"))
          }, "Discover Docker services", 8, Pu)
        ])
      ])
    ]));
  }
}), Uu = ["disabled"], Lu = ["disabled"], ys = /* @__PURE__ */ Re({
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
    const s = t;
    return (n, r) => (C(), xe(Un, {
      open: e.open,
      title: e.title,
      busy: e.busy,
      onClose: r[2] || (r[2] = (i) => s("close"))
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: e.busy,
          onClick: r[0] || (r[0] = (i) => s("close"))
        }, M(e.cancelLabel), 9, Uu),
        d("button", {
          type: "button",
          class: xt(["yarr-button", { "is-danger": e.danger }]),
          disabled: e.busy,
          onClick: r[1] || (r[1] = (i) => s("confirm"))
        }, M(e.busy ? "Working..." : e.confirmLabel), 11, Lu)
      ]),
      default: At(() => [
        d("p", null, M(e.description), 1)
      ]),
      _: 1
    }, 8, ["open", "title", "busy"]));
  }
}), Du = { class: "yarr-secret-field" }, Nu = { class: "yarr-secret-field__status" }, Yu = ["name", "checked", "disabled"], Vu = ["name", "checked", "disabled"], Bu = ["name", "aria-label", "disabled", "value"], Fu = {
  key: 2,
  class: "yarr-secret-field__pending",
  role: "status"
}, Hu = ["disabled"], Ts = /* @__PURE__ */ Re({
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
    const s = e, n = t, r = /* @__PURE__ */ H(s.intent), i = /* @__PURE__ */ H(""), l = /* @__PURE__ */ H(!1), a = `yarr-secret-${s.name}-${ti()}`;
    Je(() => s.intent, (p) => {
      r.value = p, p !== "SET" && (i.value = "");
    });
    function o(p) {
      if (r.value = p, p === "SET") {
        n("update", { kind: "SET", value: i.value });
        return;
      }
      i.value = "", n("update", { kind: p });
    }
    function u(p) {
      i.value = p, n("update", { kind: "SET", value: p });
    }
    function c() {
      l.value = !1, o("CLEAR");
    }
    return (p, v) => (C(), T(te, null, [
      d("fieldset", Du, [
        d("legend", null, M(e.label), 1),
        d("p", Nu, M(e.configured ? "Configured" : "Not configured"), 1),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "PRESERVE",
            disabled: e.disabled,
            onChange: v[0] || (v[0] = (y) => o("PRESERVE"))
          }, null, 40, Yu),
          v[5] || (v[5] = de(" Keep current value", -1))
        ]),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "SET",
            disabled: e.disabled,
            onChange: v[1] || (v[1] = (y) => o("SET"))
          }, null, 40, Vu),
          v[6] || (v[6] = de(" Set a new value", -1))
        ]),
        r.value === "SET" ? (C(), T("label", {
          key: 0,
          for: a
        }, "New " + M(e.label), 1)) : J("", !0),
        r.value === "SET" ? (C(), T("input", {
          key: 1,
          id: a,
          name: `${e.name}-new-value`,
          type: "password",
          "aria-label": `New ${e.label}`,
          autocomplete: "new-password",
          disabled: e.disabled,
          placeholder: "Enter a new value",
          value: i.value,
          onInput: v[2] || (v[2] = (y) => u(y.target.value))
        }, null, 40, Bu)) : J("", !0),
        r.value === "CLEAR" ? (C(), T("p", Fu, "This value will be cleared when changes are saved.")) : J("", !0),
        e.configured ? (C(), T("button", {
          key: 3,
          type: "button",
          class: "yarr-button is-danger is-quiet",
          disabled: e.disabled,
          onClick: v[3] || (v[3] = (y) => l.value = !0)
        }, "Clear " + M(e.label), 9, Hu)) : J("", !0)
      ]),
      le(ys, {
        open: l.value,
        title: `Clear ${e.label}?`,
        description: "Yarr may lose access until a replacement credential is saved.",
        "confirm-label": "Clear credential",
        "cancel-label": "Keep credential",
        busy: e.disabled,
        danger: "",
        onClose: v[4] || (v[4] = (y) => l.value = !1),
        onConfirm: c
      }, null, 8, ["open", "title", "busy"])
    ], 64));
  }
}), ju = {
  class: "yarr-panel",
  "aria-labelledby": "server-heading"
}, Ku = { class: "yarr-form-rows" }, qu = { class: "yarr-setting-row" }, Wu = ["checked", "disabled"], Gu = { class: "yarr-setting-row" }, Ju = ["checked", "disabled"], zu = { class: "yarr-setting-row" }, Qu = ["value", "disabled"], Xu = {
  key: 0,
  class: "yarr-setting-row"
}, Zu = ["value", "disabled"], ec = { class: "yarr-setting-row" }, tc = ["value", "disabled"], sc = { class: "yarr-setting-row" }, nc = ["value", "disabled"], rc = ["disabled"], ic = { class: "yarr-auth-section" }, oc = ["value", "disabled"], lc = {
  key: 2,
  class: "yarr-form-grid"
}, ac = ["value", "disabled"], uc = ["value", "disabled"], cc = { class: "yarr-form-rows" }, fc = { class: "yarr-setting-row" }, dc = ["checked", "disabled"], hc = {
  key: 0,
  class: "yarr-setting-row"
}, pc = ["value", "disabled"], gc = { class: "yarr-setting-row" }, bc = ["value", "disabled"], vc = ["value"], yc = /* @__PURE__ */ Re({
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
    const s = e, n = t;
    function r(a) {
      n("plugin", { ...s.plugin, ...a });
    }
    function i(a) {
      n("auth", { ...s.auth, ...a });
    }
    function l(a, o) {
      i({ [a]: o });
    }
    return (a, o) => (C(), T("section", ju, [
      o[30] || (o[30] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "server-heading" }, "Server & Auth"),
          d("p", null, "Keep Yarr on loopback unless authentication is fully configured.")
        ])
      ], -1)),
      d("div", Ku, [
        d("label", qu, [
          o[14] || (o[14] = d("span", null, [
            d("strong", null, "Run Yarr"),
            d("small", null, "Start Yarr with the array lifecycle.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.enabled,
            disabled: e.disabled,
            onChange: o[0] || (o[0] = (u) => r({ enabled: u.target.checked }))
          }, null, 40, Wu)
        ]),
        d("label", Gu, [
          o[15] || (o[15] = d("span", null, [
            d("strong", null, "Dashboard widget"),
            d("small", null, "Show compact Yarr runtime status on the Unraid dashboard.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.dashboardWidgetEnable,
            disabled: e.disabled,
            onChange: o[1] || (o[1] = (u) => r({ dashboardWidgetEnable: u.target.checked }))
          }, null, 40, Ju)
        ]),
        d("label", zu, [
          o[17] || (o[17] = d("span", null, [
            d("strong", null, "Bind mode"),
            d("small", null, "Choose which interfaces accept connections.")
          ], -1)),
          d("select", {
            value: e.plugin.bindMode,
            disabled: e.disabled,
            onChange: o[2] || (o[2] = (u) => r({ bindMode: u.target.value }))
          }, [...o[16] || (o[16] = [
            d("option", { value: "LOOPBACK" }, "Loopback only", -1),
            d("option", { value: "LAN" }, "LAN interfaces", -1),
            d("option", { value: "CUSTOM" }, "Custom address", -1)
          ])], 40, Qu)
        ]),
        e.plugin.bindMode === "CUSTOM" ? (C(), T("label", Xu, [
          o[18] || (o[18] = d("span", null, [
            d("strong", null, "Custom bind address"),
            d("small", null, "Use an IP address owned by this server.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.customHost,
            disabled: e.disabled,
            onInput: o[3] || (o[3] = (u) => r({ customHost: u.target.value }))
          }, null, 40, Zu)
        ])) : J("", !0),
        d("label", ec, [
          o[19] || (o[19] = d("span", null, [
            d("strong", null, "Port"),
            d("small", null, "Yarr API and MCP listener port.")
          ], -1)),
          d("input", {
            type: "number",
            min: "1",
            max: "65535",
            value: e.plugin.port,
            disabled: e.disabled,
            onInput: o[4] || (o[4] = (u) => r({ port: Number(u.target.value) }))
          }, null, 40, tc)
        ]),
        d("label", sc, [
          o[22] || (o[22] = d("span", null, [
            d("strong", null, "Authentication mode"),
            d("small", null, "LAN, custom, and Tailscale exposure require bearer or Google OAuth.")
          ], -1)),
          d("select", {
            value: e.plugin.authMode,
            disabled: e.disabled,
            onChange: o[5] || (o[5] = (u) => r({ authMode: u.target.value }))
          }, [
            o[20] || (o[20] = d("option", { value: "BEARER" }, "Bearer token", -1)),
            o[21] || (o[21] = d("option", { value: "GOOGLE_OAUTH" }, "Google OAuth", -1)),
            d("option", {
              value: "TRUSTED_GATEWAY",
              disabled: e.plugin.bindMode !== "LOOPBACK" || e.plugin.tailscaleServe
            }, "Trusted gateway (same-host loopback only)", 8, rc)
          ], 40, nc)
        ])
      ]),
      d("div", ic, [
        e.plugin.authMode === "BEARER" ? (C(), xe(Ts, {
          key: 0,
          name: "bearer-token",
          label: "Bearer token",
          configured: e.bearerConfigured,
          intent: e.auth.bearerToken.kind,
          disabled: e.disabled,
          onUpdate: o[6] || (o[6] = (u) => l("bearerToken", u))
        }, null, 8, ["configured", "intent", "disabled"])) : e.plugin.authMode === "GOOGLE_OAUTH" ? (C(), T(te, { key: 1 }, [
          d("label", null, [
            o[23] || (o[23] = de("Google client ID", -1)),
            d("input", {
              type: "text",
              value: e.auth.googleClientId,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: o[7] || (o[7] = (u) => i({ googleClientId: u.target.value }))
            }, null, 40, oc)
          ]),
          le(Ts, {
            name: "google-client-secret",
            label: "Google client secret",
            configured: e.googleSecretConfigured,
            intent: e.auth.googleClientSecret.kind,
            disabled: e.disabled,
            onUpdate: o[8] || (o[8] = (u) => l("googleClientSecret", u))
          }, null, 8, ["configured", "intent", "disabled"])
        ], 64)) : (C(), T("div", lc, [
          o[26] || (o[26] = d("p", null, "Trusted gateway accepts provenance only from a same-host proxy while Yarr is bound to loopback. Direct-client Host and Origin headers are not authentication.", -1)),
          d("label", null, [
            o[24] || (o[24] = de("Trusted gateway hosts", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayHosts,
              disabled: e.disabled,
              rows: "3",
              onInput: o[9] || (o[9] = (u) => i({ trustedGatewayHosts: u.target.value }))
            }, null, 40, ac)
          ]),
          d("label", null, [
            o[25] || (o[25] = de("Trusted gateway origins", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayOrigins,
              disabled: e.disabled,
              rows: "3",
              onInput: o[10] || (o[10] = (u) => i({ trustedGatewayOrigins: u.target.value }))
            }, null, 40, uc)
          ])
        ]))
      ]),
      d("div", cc, [
        d("label", fc, [
          o[27] || (o[27] = d("span", null, [
            d("strong", null, "Tailscale Serve"),
            d("small", null, "Publishes the endpoint and therefore requires bearer or Google OAuth.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.tailscaleServe,
            disabled: e.disabled,
            onChange: o[11] || (o[11] = (u) => r({ tailscaleServe: u.target.checked }))
          }, null, 40, dc)
        ]),
        e.plugin.tailscaleServe ? (C(), T("label", hc, [
          o[28] || (o[28] = d("span", null, [
            d("strong", null, "Tailscale hostname"),
            d("small", null, "DNS-label service name.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.tailscaleHostname,
            disabled: e.disabled,
            onInput: o[12] || (o[12] = (u) => r({ tailscaleHostname: u.target.value }))
          }, null, 40, pc)
        ])) : J("", !0),
        d("label", gc, [
          o[29] || (o[29] = d("span", null, [
            d("strong", null, "Log level"),
            d("small", null, "Increase verbosity only while diagnosing an issue.")
          ], -1)),
          d("select", {
            value: e.plugin.logLevel,
            disabled: e.disabled,
            onChange: o[13] || (o[13] = (u) => r({ logLevel: u.target.value }))
          }, [
            (C(), T(te, null, nt(["TRACE", "DEBUG", "INFO", "WARN", "ERROR"], (u) => d("option", {
              key: u,
              value: u
            }, M(u), 9, vc)), 64))
          ], 40, bc)
        ])
      ])
    ]));
  }
}), mc = {
  class: "yarr-panel",
  "aria-labelledby": "services-heading"
}, _c = {
  key: 0,
  class: "yarr-empty"
}, wc = ["aria-labelledby"], Sc = { class: "yarr-service-row__identity" }, Cc = ["id"], Ac = { class: "yarr-switch" }, xc = ["checked", "disabled", "onChange"], Ec = { class: "yarr-form-grid" }, Rc = ["value", "disabled", "onInput"], Tc = { key: 0 }, $c = ["value", "disabled", "onInput"], Ic = { class: "yarr-secret-grid" }, Oc = /* @__PURE__ */ Re({
  __name: "ServicesPanel",
  props: {
    services: {},
    disabled: { type: Boolean }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const s = e, n = t, r = {
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
      const c = s.services.map((p, v) => v === o ? { ...p, ...u } : p);
      n("update", c);
    }
    function a(o, u, c) {
      l(o, { [u]: c });
    }
    return (o, u) => (C(), T("section", mc, [
      u[1] || (u[1] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "services-heading" }, "Services"),
          d("p", null, "Enable only the integrations Yarr should contact.")
        ])
      ], -1)),
      e.services.length === 0 ? (C(), T("p", _c, "No service definitions are available.")) : J("", !0),
      (C(!0), T(te, null, nt(e.services, (c, p) => (C(), T("section", {
        key: c.service,
        class: "yarr-service-row",
        "aria-labelledby": `service-${c.service}`
      }, [
        d("div", Sc, [
          d("h3", {
            id: `service-${c.service}`
          }, M(i(c.service)), 9, Cc),
          d("label", Ac, [
            d("input", {
              type: "checkbox",
              checked: c.enabled,
              disabled: e.disabled,
              onChange: (v) => l(p, { enabled: v.target.checked })
            }, null, 40, xc),
            u[0] || (u[0] = de(" Enabled", -1))
          ])
        ]),
        d("div", Ec, [
          d("label", null, [
            de(M(i(c.service)) + " base URL", 1),
            d("input", {
              type: "url",
              value: c.baseUrl,
              disabled: e.disabled,
              onInput: (v) => l(p, { baseUrl: v.target.value })
            }, null, 40, Rc)
          ]),
          c.username !== null ? (C(), T("label", Tc, [
            de(M(i(c.service)) + " username", 1),
            d("input", {
              type: "text",
              value: c.username,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: (v) => l(p, { username: v.target.value })
            }, null, 40, $c)
          ])) : J("", !0)
        ]),
        d("div", Ic, [
          le(Ts, {
            name: `${c.service}-password`,
            label: `${i(c.service)} password`,
            configured: c.hasPassword,
            intent: c.password.kind,
            disabled: e.disabled,
            onUpdate: (v) => a(p, "password", v)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"]),
          le(Ts, {
            name: `${c.service}-api-key`,
            label: `${i(c.service)} API key`,
            configured: c.hasApiKey,
            intent: c.apiKey.kind,
            disabled: e.disabled,
            onUpdate: (v) => a(p, "apiKey", v)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"])
        ])
      ], 8, wc))), 128))
    ]));
  }
}), kc = ["aria-label"], Pc = {
  class: "yarr-status-badge__symbol",
  "aria-hidden": "true"
}, Mc = /* @__PURE__ */ Re({
  __name: "StatusBadge",
  props: {
    state: {},
    label: { default: void 0 }
  },
  setup(e) {
    const t = e, s = Dt(() => t.label ?? {
      success: "Available",
      warning: "Needs attention",
      danger: "Unavailable",
      neutral: "Unknown"
    }[t.state]);
    return (n, r) => (C(), T("span", {
      class: xt(["yarr-status-badge", `is-${e.state}`]),
      "aria-label": `Status: ${s.value}`
    }, [
      d("span", Pc, M(e.state === "success" ? "OK" : e.state === "danger" ? "!" : "-"), 1),
      d("span", null, M(s.value), 1)
    ], 10, kc));
  }
}), Uc = ["aria-busy"], Lc = { class: "yarr-section-heading" }, Dc = ["disabled"], Nc = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Yc = ["disabled"], Vc = {
  key: 1,
  role: "status"
}, Bc = { class: "yarr-detail-list" }, Fc = { key: 0 }, Hc = { key: 1 }, jc = { key: 2 }, Kc = { class: "yarr-actions" }, qc = ["disabled"], Wc = ["disabled"], Gc = ["disabled"], Jc = /* @__PURE__ */ Re({
  __name: "UpdatesPanel",
  emits: ["busy"],
  setup(e, { emit: t }) {
    const s = t, n = /* @__PURE__ */ H(), r = /* @__PURE__ */ H(""), i = /* @__PURE__ */ H(!1), l = /* @__PURE__ */ H(!1), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H(!1);
    let u, c = 0;
    async function p() {
      u == null || u.abort(), u = new AbortController();
      const O = ++c;
      i.value = !0, r.value = "";
      try {
        const U = await Ea(u.signal);
        O === c && (n.value = U);
      } catch {
        O === c && !u.signal.aborted && (r.value = "Update status could not be loaded. Check Yarr connectivity, then retry.");
      } finally {
        O === c && (i.value = !1);
      }
    }
    async function v() {
      if (n.value) {
        u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
        try {
          n.value = await Ia(n.value.availableVersion, u.signal), l.value = !1;
        } catch {
          u.signal.aborted || (r.value = "Update result was not confirmed. Refresh update status before retrying.");
        } finally {
          i.value = !1;
        }
      }
    }
    async function y() {
      u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
      try {
        n.value = await Oa(u.signal), a.value = !1;
      } catch {
        u.signal.aborted || (r.value = "Reset result was not confirmed. Refresh update status before retrying.");
      } finally {
        i.value = !1;
      }
    }
    async function k() {
      u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
      try {
        n.value = await ka(u.signal), o.value = !1;
      } catch {
        u.signal.aborted || (r.value = "Rollback result was not confirmed. Refresh update status before retrying.");
      } finally {
        i.value = !1;
      }
    }
    return Ns(p), Je(i, (O) => s("busy", O)), Et(() => {
      c += 1, u == null || u.abort(), s("busy", !1);
    }), (O, U) => {
      var K;
      return C(), T("section", {
        class: "yarr-panel",
        "aria-labelledby": "updates-heading",
        "aria-busy": i.value
      }, [
        d("div", Lc, [
          U[6] || (U[6] = d("div", null, [
            d("h2", { id: "updates-heading" }, "Updates"),
            d("p", null, "Install a verified release or return to the package version.")
          ], -1)),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: i.value,
            onClick: p
          }, "Check again", 8, Dc)
        ]),
        r.value ? (C(), T("div", Nc, [
          d("p", null, M(r.value), 1),
          n.value ? J("", !0) : (C(), T("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: i.value,
            onClick: p
          }, "Retry update check", 8, Yc))
        ])) : J("", !0),
        !n.value && !r.value ? (C(), T("p", Vc, "Checking update status...")) : J("", !0),
        n.value ? (C(), T(te, { key: 2 }, [
          d("dl", Bc, [
            d("div", null, [
              U[7] || (U[7] = d("dt", null, "Installed", -1)),
              d("dd", null, M(n.value.installedVersion), 1)
            ]),
            d("div", null, [
              U[8] || (U[8] = d("dt", null, "Packaged", -1)),
              d("dd", null, M(n.value.packagedVersion), 1)
            ]),
            d("div", null, [
              U[9] || (U[9] = d("dt", null, "Available", -1)),
              d("dd", null, M(n.value.availableVersion), 1)
            ]),
            d("div", null, [
              U[10] || (U[10] = d("dt", null, "Source", -1)),
              d("dd", null, M(n.value.usingOverlay ? "Update overlay" : "Plugin package"), 1)
            ])
          ]),
          d("p", {
            class: xt(["yarr-result", { "is-warning": n.value.rolledBack || n.value.message.includes("restoration incomplete") || n.value.message.startsWith("Rollback failed") || n.value.message.includes("cleanup pending") }]),
            role: "status"
          }, [
            de(M(n.value.message) + " ", 1),
            n.value.message.includes("recovery cleanup pending") ? (C(), T("strong", Fc, " The active binaries were not changed. Inspect and remove the retained directory under /mnt/user/appdata/yarr/bin before retrying.")) : n.value.message.includes("restoration incomplete") ? (C(), T("strong", Hc, " The prior binary and runtime state were not confirmed restored. Inspect the retained recovery snapshots before retrying.")) : n.value.rolledBack ? (C(), T("strong", jc, M(n.value.message.startsWith("Rollback failed") ? " The current version was restored." : " The previous version was restored."), 1)) : J("", !0)
          ], 2),
          d("div", Kc, [
            n.value.updateAvailable ? (C(), T("button", {
              key: 0,
              type: "button",
              class: "yarr-button",
              disabled: i.value,
              onClick: U[0] || (U[0] = (x) => l.value = !0)
            }, "Install " + M(n.value.availableVersion), 9, qc)) : J("", !0),
            n.value.rollbackAvailable ? (C(), T("button", {
              key: 1,
              type: "button",
              class: "yarr-button is-quiet",
              disabled: i.value,
              onClick: U[1] || (U[1] = (x) => o.value = !0)
            }, "Roll back to previous version", 8, Wc)) : J("", !0),
            d("button", {
              type: "button",
              class: "yarr-button is-danger is-quiet",
              disabled: i.value,
              onClick: U[2] || (U[2] = (x) => a.value = !0)
            }, "Reset to packaged version", 8, Gc)
          ])
        ], 64)) : J("", !0),
        le(ys, {
          open: l.value,
          title: `Install Yarr ${(K = n.value) == null ? void 0 : K.availableVersion}?`,
          description: "Yarr will restart. If readiness fails, the updater will attempt to restore the previous binary.",
          "confirm-label": "Install update",
          busy: i.value,
          onClose: U[3] || (U[3] = (x) => l.value = !1),
          onConfirm: v
        }, null, 8, ["open", "title", "busy"]),
        le(ys, {
          open: o.value,
          title: "Roll back to the previous Yarr binary?",
          description: "Yarr will preserve both binaries in durable snapshots, atomically activate yarr.previous, restart if it is running, and restore from the snapshots if readiness fails.",
          "confirm-label": "Roll back Yarr",
          busy: i.value,
          onClose: U[4] || (U[4] = (x) => o.value = !1),
          onConfirm: k
        }, null, 8, ["open", "busy"]),
        le(ys, {
          open: a.value,
          title: "Reset to packaged Yarr?",
          description: "This removes the update overlay and restarts the binary shipped by the plugin package.",
          "confirm-label": "Reset Yarr",
          busy: i.value,
          danger: "",
          onClose: U[5] || (U[5] = (x) => a.value = !1),
          onConfirm: y
        }, null, 8, ["open", "busy"])
      ], 8, Uc);
    };
  }
}), zc = ["aria-busy"], Qc = { class: "yarr-identity" }, Xc = { class: "yarr-workspace" }, Zc = {
  key: 0,
  class: "yarr-error yarr-load-error",
  role: "alert"
}, ef = ["disabled"], tf = {
  key: 1,
  class: "yarr-shell__message",
  role: "status"
}, sf = { class: "yarr-tabs-wrap" }, nf = {
  class: "yarr-tabs",
  role: "tablist",
  "aria-label": "Yarr settings sections"
}, rf = ["id", "aria-selected", "aria-controls", "tabindex", "disabled", "onClick", "onKeydown"], of = ["id", "aria-labelledby"], lf = { class: "yarr-save-bar" }, af = { "aria-live": "polite" }, uf = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, cf = {
  key: 1,
  class: "yarr-result",
  role: "status"
}, ff = { key: 2 }, df = ["disabled"], hf = /* @__PURE__ */ Re({
  __name: "YarrSettings.ce",
  setup(e) {
    const t = ["Overview", "Services", "Server & Auth", "Updates", "Logs"], s = /* @__PURE__ */ H(), n = /* @__PURE__ */ H(), r = /* @__PURE__ */ H(), i = /* @__PURE__ */ H(), l = /* @__PURE__ */ H([]), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H(!1), u = /* @__PURE__ */ H("Overview"), c = /* @__PURE__ */ H(!0), p = /* @__PURE__ */ H(!1), v = /* @__PURE__ */ H(!1), y = /* @__PURE__ */ H(""), k = /* @__PURE__ */ H(""), O = /* @__PURE__ */ H(""), U = /* @__PURE__ */ H(!1), K = /* @__PURE__ */ H(!1), x = /* @__PURE__ */ H(!1), P = /* @__PURE__ */ H([]);
    let b, B, he = 0;
    const Ie = Dt(() => s.value && n.value && r.value && i.value), _e = Dt(() => p.value || v.value);
    function gt(L, $) {
      var D;
      return ((D = L == null ? void 0 : L.extra.find((ue) => ue.key === $)) == null ? void 0 : D.value) ?? "";
    }
    function Me(L) {
      s.value = L, r.value = { ...L.plugin };
      const $ = L.services.find((D) => D.service === "yarr");
      a.value = ($ == null ? void 0 : $.hasApiKey) ?? !1, o.value = ($ == null ? void 0 : $.hasPassword) ?? !1, i.value = {
        bearerToken: { kind: "PRESERVE" },
        googleClientId: ($ == null ? void 0 : $.username) ?? "",
        googleClientSecret: { kind: "PRESERVE" },
        trustedGatewayHosts: gt($, "YARR_MCP_ALLOWED_HOSTS"),
        trustedGatewayOrigins: gt($, "YARR_MCP_ALLOWED_ORIGINS")
      }, l.value = L.services.filter((D) => D.service !== "yarr").map((D) => ({
        ...D,
        extra: D.extra.map((ue) => ({ ...ue })),
        password: { kind: "PRESERVE" },
        apiKey: { kind: "PRESERVE" }
      }));
    }
    async function ft() {
      b == null || b.abort(), b = new AbortController();
      const L = ++he;
      c.value = !0, x.value = !0, y.value = "", k.value = "";
      try {
        const [$, D] = await Promise.all([
          wa(b.signal),
          _a(b.signal)
        ]);
        if (L !== he) return;
        Me($), n.value = D;
      } catch {
        L === he && !b.signal.aborted && (y.value = "Yarr settings could not be loaded. Confirm the Unraid API is running, then retry.");
      } finally {
        L === he && (c.value = !1, x.value = !1);
      }
    }
    function bt(L, $) {
      return $.kind === "CLEAR" ? !1 : $.kind === "SET" ? $.value.trim().length > 0 : L;
    }
    function Rt() {
      return !r.value || !i.value ? "" : r.value.authMode === "TRUSTED_GATEWAY" ? r.value.bindMode !== "LOOPBACK" || r.value.tailscaleServe ? "Trusted gateway is limited to a same-host proxy with loopback binding and Tailscale Serve disabled. Use bearer or Google OAuth for network exposure." : i.value.trustedGatewayHosts.trim() === "" && i.value.trustedGatewayOrigins.trim() === "" ? "Trusted gateway authentication requires at least one allowed host or origin." : "" : r.value.bindMode === "LOOPBACK" && !r.value.tailscaleServe ? "" : r.value.authMode === "BEARER" && !bt(a.value, i.value.bearerToken) ? "Bearer authentication requires a configured token before Yarr can bind beyond loopback." : r.value.authMode === "GOOGLE_OAUTH" && (i.value.googleClientId.trim() === "" || !bt(o.value, i.value.googleClientSecret)) ? "Google OAuth requires a client ID and configured client secret before Yarr can bind beyond loopback." : "";
    }
    function dt(L) {
      return L.kind === "SET" && L.value.trim() === "" ? { kind: "PRESERVE" } : L;
    }
    function fs() {
      const L = r.value, $ = i.value;
      return {
        ...L,
        bearerToken: dt($.bearerToken),
        googleClientId: $.googleClientId,
        googleClientSecret: dt($.googleClientSecret),
        trustedGatewayHosts: $.trustedGatewayHosts,
        trustedGatewayOrigins: $.trustedGatewayOrigins,
        services: l.value.map((D) => {
          const ue = {
            service: D.service,
            enabled: D.enabled,
            password: dt(D.password),
            apiKey: dt(D.apiKey)
          };
          return D.baseUrl.trim() !== "" && (ue.baseUrl = D.baseUrl), D.username !== null && (ue.username = D.username), ue;
        })
      };
    }
    function ae(L) {
      return L.rolledBack ? `Changes were not kept. Previous configuration restored.${L.error ? ` ${L.error}` : ""}` : L.error ? `Save outcome is indeterminate. ${L.error} Check runtime status and logs before retrying.` : L.changed ? L.restarted ? "Changes saved and Yarr restarted." : "Changes saved. Yarr did not require a restart." : "No configuration changes were needed.";
    }
    async function ne() {
      const L = Rt();
      if (L) {
        k.value = L;
        return;
      }
      B == null || B.abort(), B = new AbortController(), p.value = !0, k.value = "", O.value = "";
      try {
        const $ = await Sa(fs(), B.signal);
        Me($.config), O.value = ae($);
      } catch {
        B.signal.aborted || (k.value = "Save result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    async function z(L) {
      B == null || B.abort(), B = new AbortController(), p.value = !0, k.value = "";
      try {
        n.value = await Ca(L, B.signal), O.value = L === "STOP" ? "Yarr stopped." : L === "START" ? "Yarr started." : "Yarr restarted.";
      } catch {
        B.signal.aborted || (k.value = "Control result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    function Ye(L) {
      Me(L.config), O.value = ae(L);
    }
    function vt(L, $ = !1) {
      u.value = L, $ && us(() => {
        var D;
        return (D = P.value[t.indexOf(L)]) == null ? void 0 : D.focus();
      });
    }
    function ze(L, $) {
      let D = $;
      if (L.key === "ArrowRight") D = ($ + 1) % t.length;
      else if (L.key === "ArrowLeft") D = ($ - 1 + t.length) % t.length;
      else if (L.key === "Home") D = 0;
      else if (L.key === "End") D = t.length - 1;
      else return;
      L.preventDefault(), vt(t[D], !0);
    }
    function Oe(L, $) {
      L && (P.value[$] = L);
    }
    return Ns(ft), Et(() => {
      he += 1, b == null || b.abort(), B == null || B.abort();
    }), (L, $) => (C(), T("section", {
      class: "yarr-shell yarr-settings",
      "aria-labelledby": "yarr-settings-title",
      "aria-busy": c.value || p.value
    }, [
      d("aside", Qc, [
        $[10] || ($[10] = d("p", { class: "yarr-shell__eyebrow" }, "Unraid service", -1)),
        $[11] || ($[11] = d("h1", { id: "yarr-settings-title" }, "Yarr", -1)),
        n.value ? (C(), xe(Mc, {
          key: 0,
          state: n.value.ready ? "success" : n.value.state === "running" ? "warning" : "neutral",
          label: n.value.ready ? "Ready" : n.value.state
        }, null, 8, ["state", "label"])) : J("", !0),
        $[12] || ($[12] = d("p", null, "Media service operations", -1))
      ]),
      d("main", Xc, [
        y.value ? (C(), T("div", Zc, [
          d("p", null, M(y.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: c.value,
            onClick: ft
          }, "Retry", 8, ef)
        ])) : Ie.value ? (C(), T(te, { key: 2 }, [
          d("ol", {
            class: xt(["yarr-signal-rail", { "is-refreshing": x.value }]),
            "aria-label": "Yarr lifecycle signals"
          }, [
            d("li", null, [
              $[13] || ($[13] = d("span", null, "Process", -1)),
              d("strong", null, M(n.value.state), 1)
            ]),
            d("li", null, [
              $[14] || ($[14] = d("span", null, "Ready", -1)),
              d("strong", null, M(n.value.ready ? "Yes" : "No"), 1)
            ]),
            d("li", null, [
              $[15] || ($[15] = d("span", null, "Endpoint", -1)),
              d("strong", null, M(n.value.bindAddress) + ":" + M(n.value.port), 1)
            ]),
            d("li", null, [
              $[16] || ($[16] = d("span", null, "Version", -1)),
              d("strong", null, M(n.value.version ?? "Unavailable"), 1)
            ])
          ], 2),
          d("div", sf, [
            d("div", nf, [
              (C(), T(te, null, nt(t, (D, ue) => d("button", {
                id: `yarr-tab-${ue}`,
                key: D,
                ref_for: !0,
                ref: (Qe) => Oe(Qe, ue),
                type: "button",
                role: "tab",
                "aria-selected": u.value === D,
                "aria-controls": `yarr-panel-${ue}`,
                tabindex: u.value === D ? 0 : -1,
                disabled: _e.value,
                onClick: (Qe) => vt(D),
                onKeydown: (Qe) => ze(Qe, ue)
              }, M(D), 41, rf)), 64))
            ])
          ]),
          d("div", {
            id: `yarr-panel-${t.indexOf(u.value)}`,
            role: "tabpanel",
            "aria-labelledby": `yarr-tab-${t.indexOf(u.value)}`,
            tabindex: "0"
          }, [
            u.value === "Overview" ? (C(), xe(Mu, {
              key: 0,
              runtime: n.value,
              config: s.value,
              busy: _e.value,
              onControl: z,
              onImport: $[0] || ($[0] = (D) => U.value = !0),
              onDiscover: $[1] || ($[1] = (D) => K.value = !0)
            }, null, 8, ["runtime", "config", "busy"])) : u.value === "Services" ? (C(), xe(Oc, {
              key: 1,
              services: l.value,
              disabled: _e.value,
              onUpdate: $[2] || ($[2] = (D) => l.value = D)
            }, null, 8, ["services", "disabled"])) : u.value === "Server & Auth" ? (C(), xe(yc, {
              key: 2,
              plugin: r.value,
              auth: i.value,
              "bearer-configured": a.value,
              "google-secret-configured": o.value,
              disabled: _e.value,
              onPlugin: $[3] || ($[3] = (D) => r.value = D),
              onAuth: $[4] || ($[4] = (D) => i.value = D)
            }, null, 8, ["plugin", "auth", "bearer-configured", "google-secret-configured", "disabled"])) : u.value === "Updates" ? (C(), xe(Jc, {
              key: 3,
              onBusy: $[5] || ($[5] = (D) => v.value = D)
            })) : (C(), xe(Su, { key: 4 }))
          ], 8, of),
          d("div", lf, [
            d("div", af, [
              k.value ? (C(), T("p", uf, M(k.value), 1)) : O.value ? (C(), T("p", cf, M(O.value), 1)) : (C(), T("p", ff, "Changes are validated again by the Yarr service before they are applied."))
            ]),
            d("button", {
              type: "button",
              class: "yarr-button",
              disabled: _e.value,
              onClick: ne
            }, M(p.value ? "Saving..." : "Save changes"), 9, df)
          ])
        ], 64)) : (C(), T("p", tf, "Loading Yarr operations..."))
      ]),
      le(fu, {
        open: U.value,
        onClose: $[6] || ($[6] = (D) => U.value = !1),
        onApplied: Ye,
        onBusy: $[7] || ($[7] = (D) => v.value = D)
      }, null, 8, ["open"]),
      le(Ja, {
        open: K.value,
        onClose: $[8] || ($[8] = (D) => K.value = !1),
        onApplied: Ye,
        onBusy: $[9] || ($[9] = (D) => v.value = D)
      }, null, 8, ["open"])
    ], 8, zc));
  }
}), pf = /* @__PURE__ */ Wl(hf, { shadowRoot: !1 });
customElements.get("yarr-settings-app") || customElements.define("yarr-settings-app", pf);
