/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function hs(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const n of e.split(",")) t[n] = 1;
  return (n) => n in t;
}
const te = {}, Ot = [], ze = () => {
}, Ar = () => !1, On = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), kn = (e) => e.startsWith("onUpdate:"), oe = Object.assign, ps = (e, t) => {
  const n = e.indexOf(t);
  n > -1 && e.splice(n, 1);
}, Li = Object.prototype.hasOwnProperty, z = (e, t) => Li.call(e, t), B = Array.isArray, kt = (e) => un(e) === "[object Map]", Yt = (e) => un(e) === "[object Set]", Bs = (e) => un(e) === "[object Date]", j = (e) => typeof e == "function", ie = (e) => typeof e == "string", Ue = (e) => typeof e == "symbol", Z = (e) => e !== null && typeof e == "object", Er = (e) => (Z(e) || j(e)) && j(e.then) && j(e.catch), Rr = Object.prototype.toString, un = (e) => Rr.call(e), Ui = (e) => un(e).slice(8, -1), Pn = (e) => un(e) === "[object Object]", gs = (e) => ie(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, zt = /* @__PURE__ */ hs(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), Mn = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((n) => t[n] || (t[n] = e(n)));
}, Ni = /-\w/g, Ae = Mn(
  (e) => e.replace(Ni, (t) => t.slice(1).toUpperCase())
), Di = /\B([A-Z])/g, ke = Mn(
  (e) => e.replace(Di, "-$1").toLowerCase()
), xr = Mn((e) => e.charAt(0).toUpperCase() + e.slice(1)), Kn = Mn(
  (e) => e ? `on${xr(e)}` : ""
), We = (e, t) => !Object.is(e, t), vn = (e, ...t) => {
  for (let n = 0; n < e.length; n++)
    e[n](...t);
}, Tr = (e, t, n, s = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: s,
    value: n
  });
}, Ln = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, Vs = (e) => {
  const t = ie(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let Fs;
const Un = () => Fs || (Fs = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : {});
function bs(e) {
  if (B(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++) {
      const s = e[n], r = ie(s) ? Fi(s) : bs(s);
      if (r)
        for (const i in r)
          t[i] = r[i];
    }
    return t;
  } else if (ie(e) || Z(e))
    return e;
}
const Yi = /;(?![^(]*\))/g, Bi = /:([^]+)/, Vi = /\/\*[^]*?\*\//g;
function Fi(e) {
  const t = {};
  return e.replace(Vi, "").split(Yi).forEach((n) => {
    if (n) {
      const s = n.split(Bi);
      s.length > 1 && (t[s[0].trim()] = s[1].trim());
    }
  }), t;
}
function Et(e) {
  let t = "";
  if (ie(e))
    t = e;
  else if (B(e))
    for (let n = 0; n < e.length; n++) {
      const s = Et(e[n]);
      s && (t += s + " ");
    }
  else if (Z(e))
    for (const n in e)
      e[n] && (t += n + " ");
  return t.trim();
}
const Hi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", ji = /* @__PURE__ */ hs(Hi);
function $r(e) {
  return !!e || e === "";
}
function Ki(e, t) {
  if (e.length !== t.length) return !1;
  let n = !0;
  for (let s = 0; n && s < e.length; s++)
    n = Bt(e[s], t[s]);
  return n;
}
function Bt(e, t) {
  if (e === t) return !0;
  let n = Bs(e), s = Bs(t);
  if (n || s)
    return n && s ? e.getTime() === t.getTime() : !1;
  if (n = Ue(e), s = Ue(t), n || s)
    return e === t;
  if (n = B(e), s = B(t), n || s)
    return n && s ? Ki(e, t) : !1;
  if (n = Z(e), s = Z(t), n || s) {
    if (!n || !s)
      return !1;
    const r = Object.keys(e).length, i = Object.keys(t).length;
    if (r !== i)
      return !1;
    for (const l in e) {
      const a = e.hasOwnProperty(l), o = t.hasOwnProperty(l);
      if (a && !o || !a && o || !Bt(e[l], t[l]))
        return !1;
    }
  }
  return String(e) === String(t);
}
function vs(e, t) {
  return e.findIndex((n) => Bt(n, t));
}
const Ir = (e) => !!(e && e.__v_isRef === !0), M = (e) => ie(e) ? e : e == null ? "" : B(e) || Z(e) && (e.toString === Rr || !j(e.toString)) ? Ir(e) ? M(e.value) : JSON.stringify(e, Or, 2) : String(e), Or = (e, t) => Ir(t) ? Or(e, t.value) : kt(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (n, [s, r], i) => (n[qn(s, i) + " =>"] = r, n),
    {}
  )
} : Yt(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((n) => qn(n))
} : Ue(t) ? qn(t) : Z(t) && !B(t) && !Pn(t) ? String(t) : t, qn = (e, t = "") => {
  var n;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Ue(e) ? `Symbol(${(n = e.description) != null ? n : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let pe;
class qi {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && pe && (pe.active ? (this.parent = pe, this.index = (pe.scopes || (pe.scopes = [])).push(
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
      const n = pe;
      try {
        return pe = this, t();
      } finally {
        pe = n;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = pe, pe = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (pe === this)
        pe = this.prevScope;
      else {
        let t = pe;
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
  return pe;
}
let re;
const Wn = /* @__PURE__ */ new WeakSet();
class kr {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, pe && (pe.active ? pe.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, Wn.has(this) && (Wn.delete(this), this.trigger()));
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
    this.flags |= 2, Hs(this), Lr(this);
    const t = re, n = Le;
    re = this, Le = !0;
    try {
      return this.fn();
    } finally {
      Ur(this), re = t, Le = n, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        _s(t);
      this.deps = this.depsTail = void 0, Hs(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? Wn.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    ns(this) && this.run();
  }
  get dirty() {
    return ns(this);
  }
}
let Pr = 0, Jt, Qt;
function Mr(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = Qt, Qt = e;
    return;
  }
  e.next = Jt, Jt = e;
}
function ys() {
  Pr++;
}
function ms() {
  if (--Pr > 0)
    return;
  if (Qt) {
    let t = Qt;
    for (Qt = void 0; t; ) {
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
function Lr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function Ur(e) {
  let t, n = e.depsTail, s = n;
  for (; s; ) {
    const r = s.prevDep;
    s.version === -1 ? (s === n && (n = r), _s(s), Gi(s)) : t = s, s.dep.activeLink = s.prevActiveLink, s.prevActiveLink = void 0, s = r;
  }
  e.deps = t, e.depsTail = n;
}
function ns(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (Nr(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function Nr(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === nn) || (e.globalVersion = nn, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !ns(e))))
    return;
  e.flags |= 2;
  const t = e.dep, n = re, s = Le;
  re = e, Le = !0;
  try {
    Lr(e);
    const r = e.fn(e._value);
    (t.version === 0 || We(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    re = n, Le = s, Ur(e), e.flags &= -3;
  }
}
function _s(e, t = !1) {
  const { dep: n, prevSub: s, nextSub: r } = e;
  if (s && (s.nextSub = r, e.prevSub = void 0), r && (r.prevSub = s, e.nextSub = void 0), n.subs === e && (n.subs = s, !s && n.computed)) {
    n.computed.flags &= -5;
    for (let i = n.computed.deps; i; i = i.nextDep)
      _s(i, !0);
  }
  !t && !--n.sc && n.map && n.map.delete(n.key);
}
function Gi(e) {
  const { prevDep: t, nextDep: n } = e;
  t && (t.nextDep = n, e.prevDep = void 0), n && (n.prevDep = t, e.nextDep = void 0);
}
let Le = !0;
const Dr = [];
function ot() {
  Dr.push(Le), Le = !1;
}
function lt() {
  const e = Dr.pop();
  Le = e === void 0 ? !0 : e;
}
function Hs(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const n = re;
    re = void 0;
    try {
      t();
    } finally {
      re = n;
    }
  }
}
let nn = 0;
class zi {
  constructor(t, n) {
    this.sub = t, this.dep = n, this.version = n.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class ws {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!re || !Le || re === this.computed)
      return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== re)
      n = this.activeLink = new zi(re, this), re.deps ? (n.prevDep = re.depsTail, re.depsTail.nextDep = n, re.depsTail = n) : re.deps = re.depsTail = n, Yr(n);
    else if (n.version === -1 && (n.version = this.version, n.nextDep)) {
      const s = n.nextDep;
      s.prevDep = n.prevDep, n.prevDep && (n.prevDep.nextDep = s), n.prevDep = re.depsTail, n.nextDep = void 0, re.depsTail.nextDep = n, re.depsTail = n, re.deps === n && (re.deps = s);
    }
    return n;
  }
  trigger(t) {
    this.version++, nn++, this.notify(t);
  }
  notify(t) {
    ys();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      ms();
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
const ss = /* @__PURE__ */ new WeakMap(), wt = /* @__PURE__ */ Symbol(
  ""
), rs = /* @__PURE__ */ Symbol(
  ""
), sn = /* @__PURE__ */ Symbol(
  ""
);
function ge(e, t, n) {
  if (Le && re) {
    let s = ss.get(e);
    s || ss.set(e, s = /* @__PURE__ */ new Map());
    let r = s.get(n);
    r || (s.set(n, r = new ws()), r.map = s, r.key = n), r.track();
  }
}
function tt(e, t, n, s, r, i) {
  const l = ss.get(e);
  if (!l) {
    nn++;
    return;
  }
  const a = (o) => {
    o && o.trigger();
  };
  if (ys(), t === "clear")
    l.forEach(a);
  else {
    const o = B(e), u = o && gs(n);
    if (o && n === "length") {
      const c = Number(s);
      l.forEach((p, y) => {
        (y === "length" || y === sn || !Ue(y) && y >= c) && a(p);
      });
    } else
      switch ((n !== void 0 || l.has(void 0)) && a(l.get(n)), u && a(l.get(sn)), t) {
        case "add":
          o ? u && a(l.get("length")) : (a(l.get(wt)), kt(e) && a(l.get(rs)));
          break;
        case "delete":
          o || (a(l.get(wt)), kt(e) && a(l.get(rs)));
          break;
        case "set":
          kt(e) && a(l.get(wt));
          break;
      }
  }
  ms();
}
function $t(e) {
  const t = /* @__PURE__ */ J(e);
  return t === e ? t : (ge(t, "iterate", sn), /* @__PURE__ */ Pe(e) ? t : t.map(Ne));
}
function Nn(e) {
  return ge(e = /* @__PURE__ */ J(e), "iterate", sn), e;
}
function Ke(e, t) {
  return /* @__PURE__ */ at(e) ? Ut(/* @__PURE__ */ Ct(e) ? Ne(t) : t) : Ne(t);
}
const Ji = {
  __proto__: null,
  [Symbol.iterator]() {
    return Gn(this, Symbol.iterator, (e) => Ke(this, e));
  },
  concat(...e) {
    return $t(this).concat(
      ...e.map((t) => B(t) ? $t(t) : t)
    );
  },
  entries() {
    return Gn(this, "entries", (e) => (e[1] = Ke(this, e[1]), e));
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
    return zn(this, "includes", e);
  },
  indexOf(...e) {
    return zn(this, "indexOf", e);
  },
  join(e) {
    return $t(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return zn(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Xe(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return jt(this, "pop");
  },
  push(...e) {
    return jt(this, "push", e);
  },
  reduce(e, ...t) {
    return js(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return js(this, "reduceRight", e, t);
  },
  shift() {
    return jt(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Xe(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return jt(this, "splice", e);
  },
  toReversed() {
    return $t(this).toReversed();
  },
  toSorted(e) {
    return $t(this).toSorted(e);
  },
  toSpliced(...e) {
    return $t(this).toSpliced(...e);
  },
  unshift(...e) {
    return jt(this, "unshift", e);
  },
  values() {
    return Gn(this, "values", (e) => Ke(this, e));
  }
};
function Gn(e, t, n) {
  const s = Nn(e), r = s[t]();
  return s !== e && !/* @__PURE__ */ Pe(e) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.done || (i.value = n(i.value)), i;
  }), r;
}
const Qi = Array.prototype;
function Xe(e, t, n, s, r, i) {
  const l = Nn(e), a = l !== e && !/* @__PURE__ */ Pe(e), o = l[t];
  if (o !== Qi[t]) {
    const p = o.apply(e, i);
    return a ? Ne(p) : p;
  }
  let u = n;
  l !== e && (a ? u = function(p, y) {
    return n.call(this, Ke(e, p), y, e);
  } : n.length > 2 && (u = function(p, y) {
    return n.call(this, p, y, e);
  }));
  const c = o.call(l, u, s);
  return a && r ? r(c) : c;
}
function js(e, t, n, s) {
  const r = Nn(e), i = r !== e && !/* @__PURE__ */ Pe(e);
  let l = n, a = !1;
  r !== e && (i ? (a = s.length === 0, l = function(u, c, p) {
    return a && (a = !1, u = Ke(e, u)), n.call(this, u, Ke(e, c), p, e);
  }) : n.length > 3 && (l = function(u, c, p) {
    return n.call(this, u, c, p, e);
  }));
  const o = r[t](l, ...s);
  return a ? Ke(e, o) : o;
}
function zn(e, t, n) {
  const s = /* @__PURE__ */ J(e);
  ge(s, "iterate", sn);
  const r = s[t](...n);
  return (r === -1 || r === !1) && /* @__PURE__ */ Es(n[0]) ? (n[0] = /* @__PURE__ */ J(n[0]), s[t](...n)) : r;
}
function jt(e, t, n = []) {
  ot(), ys();
  const s = (/* @__PURE__ */ J(e))[t].apply(e, n);
  return ms(), lt(), s;
}
const Xi = /* @__PURE__ */ hs("__proto__,__v_isRef,__isVue"), Br = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Ue)
);
function Zi(e) {
  Ue(e) || (e = String(e));
  const t = /* @__PURE__ */ J(this);
  return ge(t, "has", e), t.hasOwnProperty(e);
}
class Vr {
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
    const l = B(t);
    if (!r) {
      let o;
      if (l && (o = Ji[n]))
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
      /* @__PURE__ */ ve(t) ? t : s
    );
    if ((Ue(n) ? Br.has(n) : Xi(n)) || (r || ge(t, "get", n), i))
      return a;
    if (/* @__PURE__ */ ve(a)) {
      const o = l && gs(n) ? a : a.value;
      return r && Z(o) ? /* @__PURE__ */ os(o) : o;
    }
    return Z(a) ? r ? /* @__PURE__ */ os(a) : /* @__PURE__ */ Ss(a) : a;
  }
}
class Fr extends Vr {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, n, s, r) {
    let i = t[n];
    const l = B(t) && gs(n);
    if (!this._isShallow) {
      const u = /* @__PURE__ */ at(i);
      if (!/* @__PURE__ */ Pe(s) && !/* @__PURE__ */ at(s) && (i = /* @__PURE__ */ J(i), s = /* @__PURE__ */ J(s)), !l && /* @__PURE__ */ ve(i) && !/* @__PURE__ */ ve(s))
        return u || (i.value = s), !0;
    }
    const a = l ? Number(n) < t.length : z(t, n), o = Reflect.set(
      t,
      n,
      s,
      /* @__PURE__ */ ve(t) ? t : r
    );
    return t === /* @__PURE__ */ J(r) && o && (a ? We(s, i) && tt(t, "set", n, s) : tt(t, "add", n, s)), o;
  }
  deleteProperty(t, n) {
    const s = z(t, n);
    t[n];
    const r = Reflect.deleteProperty(t, n);
    return r && s && tt(t, "delete", n, void 0), r;
  }
  has(t, n) {
    const s = Reflect.has(t, n);
    return (!Ue(n) || !Br.has(n)) && ge(t, "has", n), s;
  }
  ownKeys(t) {
    return ge(
      t,
      "iterate",
      B(t) ? "length" : wt
    ), Reflect.ownKeys(t);
  }
}
class eo extends Vr {
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
const to = /* @__PURE__ */ new Fr(), no = /* @__PURE__ */ new eo(), so = /* @__PURE__ */ new Fr(!0);
const is = (e) => e, pn = (e) => Reflect.getPrototypeOf(e);
function ro(e, t, n) {
  return function(...s) {
    const r = this.__v_raw, i = /* @__PURE__ */ J(r), l = kt(i), a = e === "entries" || e === Symbol.iterator && l, o = e === "keys" && l, u = r[e](...s), c = n ? is : t ? Ut : Ne;
    return !t && ge(
      i,
      "iterate",
      o ? rs : wt
    ), oe(
      // inheriting all iterator properties
      Object.create(u),
      {
        // iterator protocol
        next() {
          const { value: p, done: y } = u.next();
          return y ? { value: p, done: y } : {
            value: a ? [c(p[0]), c(p[1])] : c(p),
            done: y
          };
        }
      }
    );
  };
}
function gn(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function io(e, t) {
  const n = {
    get(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ J(i), a = /* @__PURE__ */ J(r);
      e || (We(r, a) && ge(l, "get", r), ge(l, "get", a));
      const { has: o } = pn(l), u = t ? is : e ? Ut : Ne;
      if (o.call(l, r))
        return u(i.get(r));
      if (o.call(l, a))
        return u(i.get(a));
      i !== l && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && ge(/* @__PURE__ */ J(r), "iterate", wt), r.size;
    },
    has(r) {
      const i = this.__v_raw, l = /* @__PURE__ */ J(i), a = /* @__PURE__ */ J(r);
      return e || (We(r, a) && ge(l, "has", r), ge(l, "has", a)), r === a ? i.has(r) : i.has(r) || i.has(a);
    },
    forEach(r, i) {
      const l = this, a = l.__v_raw, o = /* @__PURE__ */ J(a), u = t ? is : e ? Ut : Ne;
      return !e && ge(o, "iterate", wt), a.forEach((c, p) => r.call(i, u(c), u(p), l));
    }
  };
  return oe(
    n,
    e ? {
      add: gn("add"),
      set: gn("set"),
      delete: gn("delete"),
      clear: gn("clear")
    } : {
      add(r) {
        const i = /* @__PURE__ */ J(this), l = pn(i), a = /* @__PURE__ */ J(r), o = !t && !/* @__PURE__ */ Pe(r) && !/* @__PURE__ */ at(r) ? a : r;
        return l.has.call(i, o) || We(r, o) && l.has.call(i, r) || We(a, o) && l.has.call(i, a) || (i.add(o), tt(i, "add", o, o)), this;
      },
      set(r, i) {
        !t && !/* @__PURE__ */ Pe(i) && !/* @__PURE__ */ at(i) && (i = /* @__PURE__ */ J(i));
        const l = /* @__PURE__ */ J(this), { has: a, get: o } = pn(l);
        let u = a.call(l, r);
        u || (r = /* @__PURE__ */ J(r), u = a.call(l, r));
        const c = o.call(l, r);
        return l.set(r, i), u ? We(i, c) && tt(l, "set", r, i) : tt(l, "add", r, i), this;
      },
      delete(r) {
        const i = /* @__PURE__ */ J(this), { has: l, get: a } = pn(i);
        let o = l.call(i, r);
        o || (r = /* @__PURE__ */ J(r), o = l.call(i, r)), a && a.call(i, r);
        const u = i.delete(r);
        return o && tt(i, "delete", r, void 0), u;
      },
      clear() {
        const r = /* @__PURE__ */ J(this), i = r.size !== 0, l = r.clear();
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
function Cs(e, t) {
  const n = io(e, t);
  return (s, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? s : Reflect.get(
    z(n, r) && r in s ? n : s,
    r,
    i
  );
}
const oo = {
  get: /* @__PURE__ */ Cs(!1, !1)
}, lo = {
  get: /* @__PURE__ */ Cs(!1, !0)
}, ao = {
  get: /* @__PURE__ */ Cs(!0, !1)
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
  return /* @__PURE__ */ at(e) ? e : As(
    e,
    !1,
    to,
    oo,
    Hr
  );
}
// @__NO_SIDE_EFFECTS__
function fo(e) {
  return As(
    e,
    !1,
    so,
    lo,
    jr
  );
}
// @__NO_SIDE_EFFECTS__
function os(e) {
  return As(
    e,
    !0,
    no,
    ao,
    Kr
  );
}
function As(e, t, n, s, r) {
  if (!Z(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const i = r.get(e);
  if (i)
    return i;
  const l = co(Ui(e));
  if (l === 0)
    return e;
  const a = new Proxy(
    e,
    l === 2 ? s : n
  );
  return r.set(e, a), a;
}
// @__NO_SIDE_EFFECTS__
function Ct(e) {
  return /* @__PURE__ */ at(e) ? /* @__PURE__ */ Ct(e.__v_raw) : !!(e && e.__v_isReactive);
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
function Es(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function J(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ J(t) : e;
}
function ho(e) {
  return !z(e, "__v_skip") && Object.isExtensible(e) && Tr(e, "__v_skip", !0), e;
}
const Ne = (e) => Z(e) ? /* @__PURE__ */ Ss(e) : e, Ut = (e) => Z(e) ? /* @__PURE__ */ os(e) : e;
// @__NO_SIDE_EFFECTS__
function ve(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function H(e) {
  return po(e, !1);
}
function po(e, t) {
  return /* @__PURE__ */ ve(e) ? e : new go(e, t);
}
class go {
  constructor(t, n) {
    this.dep = new ws(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = n ? t : /* @__PURE__ */ J(t), this._value = n ? t : Ne(t), this.__v_isShallow = n;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const n = this._rawValue, s = this.__v_isShallow || /* @__PURE__ */ Pe(t) || /* @__PURE__ */ at(t);
    t = s ? t : /* @__PURE__ */ J(t), We(t, n) && (this._rawValue = t, this._value = s ? t : Ne(t), this.dep.trigger());
  }
}
function qr(e) {
  return /* @__PURE__ */ ve(e) ? e.value : e;
}
const bo = {
  get: (e, t, n) => t === "__v_raw" ? e : qr(Reflect.get(e, t, n)),
  set: (e, t, n, s) => {
    const r = e[t];
    return /* @__PURE__ */ ve(r) && !/* @__PURE__ */ ve(n) ? (r.value = n, !0) : Reflect.set(e, t, n, s);
  }
};
function Wr(e) {
  return /* @__PURE__ */ Ct(e) ? e : new Proxy(e, bo);
}
class vo {
  constructor(t, n, s) {
    this.fn = t, this.setter = n, this._value = void 0, this.dep = new ws(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = nn - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !n, this.isSSR = s;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    re !== this)
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
  return j(e) ? s = e : (s = e.get, r = e.set), new vo(s, r, n);
}
const bn = {}, wn = /* @__PURE__ */ new WeakMap();
let _t;
function mo(e, t = !1, n = _t) {
  if (n) {
    let s = wn.get(n);
    s || wn.set(n, s = []), s.push(e);
  }
}
function _o(e, t, n = te) {
  const { immediate: s, deep: r, once: i, scheduler: l, augmentJob: a, call: o } = n, u = (v) => r ? v : /* @__PURE__ */ Pe(v) || r === !1 || r === 0 ? nt(v, 1) : nt(v);
  let c, p, y, b, I = !1, P = !1;
  if (/* @__PURE__ */ ve(e) ? (p = () => e.value, I = /* @__PURE__ */ Pe(e)) : /* @__PURE__ */ Ct(e) ? (p = () => u(e), I = !0) : B(e) ? (P = !0, I = e.some((v) => /* @__PURE__ */ Ct(v) || /* @__PURE__ */ Pe(v)), p = () => e.map((v) => {
    if (/* @__PURE__ */ ve(v))
      return v.value;
    if (/* @__PURE__ */ Ct(v))
      return u(v);
    if (j(v))
      return o ? o(v, 2) : v();
  })) : j(e) ? t ? p = o ? () => o(e, 2) : e : p = () => {
    if (y) {
      ot();
      try {
        y();
      } finally {
        lt();
      }
    }
    const v = _t;
    _t = c;
    try {
      return o ? o(e, 3, [b]) : e(b);
    } finally {
      _t = v;
    }
  } : p = ze, t && r) {
    const v = p, U = r === !0 ? 1 / 0 : r;
    p = () => nt(v(), U);
  }
  const q = Wi(), K = () => {
    c.stop(), q && q.active && ps(q.effects, c);
  };
  if (i && t) {
    const v = t;
    t = (...U) => {
      const F = v(...U);
      return K(), F;
    };
  }
  let x = P ? new Array(e.length).fill(bn) : bn;
  const k = (v) => {
    if (!(!(c.flags & 1) || !c.dirty && !v))
      if (t) {
        const U = c.run();
        if (v || r || I || (P ? U.some((F, ye) => We(F, x[ye])) : We(U, x))) {
          y && y();
          const F = _t;
          _t = c;
          try {
            const ye = [
              U,
              // pass undefined as the old value when it's changed for the first time
              x === bn ? void 0 : P && x[0] === bn ? [] : x,
              b
            ];
            x = U, o ? o(t, 3, ye) : (
              // @ts-expect-error
              t(...ye)
            );
          } finally {
            _t = F;
          }
        }
      } else
        c.run();
  };
  return a && a(k), c = new kr(p), c.scheduler = l ? () => l(k, !1) : k, b = (v) => mo(v, !1, c), y = c.onStop = () => {
    const v = wn.get(c);
    if (v) {
      if (o)
        o(v, 4);
      else
        for (const U of v) U();
      wn.delete(c);
    }
  }, t ? s ? k(!0) : x = c.run() : l ? l(k.bind(null, !0), !0) : c.run(), K.pause = c.pause.bind(c), K.resume = c.resume.bind(c), K.stop = K, K;
}
function nt(e, t = 1 / 0, n) {
  if (t <= 0 || !Z(e) || e.__v_skip || (n = n || /* @__PURE__ */ new Map(), (n.get(e) || 0) >= t))
    return e;
  if (n.set(e, t), t--, /* @__PURE__ */ ve(e))
    nt(e.value, t, n);
  else if (B(e))
    for (let s = 0; s < e.length; s++)
      nt(e[s], t, n);
  else if (Yt(e) || kt(e))
    e.forEach((s) => {
      nt(s, t, n);
    });
  else if (Pn(e)) {
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
function cn(e, t, n, s) {
  try {
    return s ? e(...s) : e();
  } catch (r) {
    Dn(r, t, n);
  }
}
function De(e, t, n, s) {
  if (j(e)) {
    const r = cn(e, t, n, s);
    return r && Er(r) && r.catch((i) => {
      Dn(i, t, n);
    }), r;
  }
  if (B(e)) {
    const r = [];
    for (let i = 0; i < e.length; i++)
      r.push(De(e[i], t, n, s));
    return r;
  }
}
function Dn(e, t, n, s = !0) {
  const r = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: l } = t && t.appContext.config || te;
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
      ot(), cn(i, null, 10, [
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
const _e = [];
let je = -1;
const Pt = [];
let ht = null, It = 0;
const Gr = /* @__PURE__ */ Promise.resolve();
let Cn = null;
function fn(e) {
  const t = Cn || Gr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function Co(e) {
  let t = je + 1, n = _e.length;
  for (; t < n; ) {
    const s = t + n >>> 1, r = _e[s], i = rn(r);
    i < e || i === e && r.flags & 2 ? t = s + 1 : n = s;
  }
  return t;
}
function Rs(e) {
  if (!(e.flags & 1)) {
    const t = rn(e), n = _e[_e.length - 1];
    !n || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= rn(n) ? _e.push(e) : _e.splice(Co(t), 0, e), e.flags |= 1, zr();
  }
}
function zr() {
  Cn || (Cn = Gr.then(Qr));
}
function So(e) {
  B(e) ? Pt.push(...e) : ht && e.id === -1 ? ht.splice(It + 1, 0, e) : e.flags & 1 || (Pt.push(e), e.flags |= 1), zr();
}
function Ks(e, t, n = je + 1) {
  for (; n < _e.length; n++) {
    const s = _e[n];
    if (s && s.flags & 2) {
      if (e && s.id !== e.uid)
        continue;
      _e.splice(n, 1), n--, s.flags & 4 && (s.flags &= -2), s(), s.flags & 4 || (s.flags &= -2);
    }
  }
}
function Jr(e) {
  if (Pt.length) {
    const t = [...new Set(Pt)].sort(
      (n, s) => rn(n) - rn(s)
    );
    if (Pt.length = 0, ht) {
      ht.push(...t);
      return;
    }
    for (ht = t, It = 0; It < ht.length; It++) {
      const n = ht[It];
      n.flags & 4 && (n.flags &= -2), n.flags & 8 || n(), n.flags &= -2;
    }
    ht = null, It = 0;
  }
}
const rn = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function Qr(e) {
  try {
    for (je = 0; je < _e.length; je++) {
      const t = _e[je];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), cn(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; je < _e.length; je++) {
      const t = _e[je];
      t && (t.flags &= -2);
    }
    je = -1, _e.length = 0, Jr(), Cn = null, (_e.length || Pt.length) && Qr();
  }
}
let be = null, Xr = null;
function Sn(e) {
  const t = be;
  return be = e, Xr = e && e.type.__scopeId || null, t;
}
function At(e, t = be, n) {
  if (!t || e._n)
    return e;
  const s = (...r) => {
    s._d && sr(-1);
    const i = Sn(t), l = rt.length;
    let a;
    try {
      a = e(...r);
    } finally {
      for (let o = rt.length; o > l; o--) Is();
      Sn(i), s._d && sr(1);
    }
    return a;
  };
  return s._n = !0, s._c = !0, s._d = !0, s;
}
function St(e, t) {
  if (be === null)
    return e;
  const n = Hn(be), s = e.dirs || (e.dirs = []);
  for (let r = 0; r < t.length; r++) {
    let [i, l, a, o = te] = t[r];
    i && (j(i) && (i = {
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
    o && (ot(), De(o, n, 8, [
      e.el,
      a,
      e,
      t
    ]), lt());
  }
}
function Ao(e, t) {
  if (we) {
    let n = we.provides;
    const s = we.parent && we.parent.provides;
    s === n && (n = we.provides = Object.create(s)), n[e] = t;
  }
}
function yn(e, t, n = !1) {
  const s = Ri();
  if (s || Lt) {
    let r = Lt ? Lt._context.provides : s ? s.parent == null || s.ce ? s.vnode.appContext && s.vnode.appContext.provides : s.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return n && j(t) ? t.call(s && s.proxy) : t;
  }
}
const Eo = /* @__PURE__ */ Symbol.for("v-scx"), Ro = () => yn(Eo);
function Je(e, t, n) {
  return Zr(e, t, n);
}
function Zr(e, t, n = te) {
  const { immediate: s, deep: r, flush: i, once: l } = n, a = oe({}, n), o = t && s || !t && i !== "post";
  let u;
  if (ln) {
    if (i === "sync") {
      const b = Ro();
      u = b.__watcherHandles || (b.__watcherHandles = []);
    } else if (!o) {
      const b = () => {
      };
      return b.stop = ze, b.resume = ze, b.pause = ze, b;
    }
  }
  const c = we;
  a.call = (b, I, P) => De(b, c, I, P);
  let p = !1;
  i === "post" ? a.scheduler = (b) => {
    Ce(b, c && c.suspense);
  } : i !== "sync" && (p = !0, a.scheduler = (b, I) => {
    I ? b() : Rs(b);
  }), a.augmentJob = (b) => {
    t && (b.flags |= 4), p && (b.flags |= 2, c && (b.id = c.uid, b.i = c));
  };
  const y = _o(e, t, a);
  return ln && (u ? u.push(y) : o && y()), y;
}
function xo(e, t, n) {
  const s = this.proxy, r = ie(e) ? e.includes(".") ? ei(s, e) : () => s[e] : e.bind(s, s);
  let i;
  j(t) ? i = t : (i = t.handler, n = t);
  const l = dn(this), a = Zr(r, i.bind(s), n);
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
const To = /* @__PURE__ */ Symbol("_vte"), $o = (e) => e.__isTeleport, Jn = /* @__PURE__ */ Symbol("_leaveCb");
function xs(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, xs(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function Te(e, t) {
  return j(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    oe({ name: e.name }, t, { setup: e })
  ) : e;
}
function ti() {
  const e = Ri();
  return e ? (e.appContext.config.idPrefix || "v") + "-" + e.ids[0] + e.ids[1]++ : "";
}
function ni(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function qs(e, t) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(e, t)) && !n.configurable);
}
const An = /* @__PURE__ */ new WeakMap();
function Xt(e, t, n, s, r = !1) {
  if (B(e)) {
    e.forEach(
      (P, q) => Xt(
        P,
        t && (B(t) ? t[q] : t),
        n,
        s,
        r
      )
    );
    return;
  }
  if (Mt(s) && !r) {
    s.shapeFlag & 512 && s.type.__asyncResolved && s.component.subTree.component && Xt(e, t, n, s.component.subTree);
    return;
  }
  const i = s.shapeFlag & 4 ? Hn(s.component) : s.el, l = r ? null : i, { i: a, r: o } = e, u = t && t.r, c = a.refs === te ? a.refs = {} : a.refs, p = a.setupState, y = /* @__PURE__ */ J(p), b = p === te ? Ar : (P) => qs(c, P) ? !1 : z(y, P), I = (P, q) => !(q && qs(c, q));
  if (u != null && u !== o) {
    if (Ws(t), ie(u))
      c[u] = null, b(u) && (p[u] = null);
    else if (/* @__PURE__ */ ve(u)) {
      const P = t;
      I(u, P.k) && (u.value = null), P.k && (c[P.k] = null);
    }
  }
  if (j(o))
    cn(o, a, 12, [l, c]);
  else {
    const P = ie(o), q = /* @__PURE__ */ ve(o);
    if (P || q) {
      const K = () => {
        if (e.f) {
          const x = P ? b(o) ? p[o] : c[o] : I() || !e.k ? o.value : c[e.k];
          if (r)
            B(x) && ps(x, i);
          else if (B(x))
            x.includes(i) || x.push(i);
          else if (P)
            c[o] = [i], b(o) && (p[o] = c[o]);
          else {
            const k = [i];
            I(o, e.k) && (o.value = k), e.k && (c[e.k] = k);
          }
        } else P ? (c[o] = l, b(o) && (p[o] = l)) : q && (I(o, e.k) && (o.value = l), e.k && (c[e.k] = l));
      };
      if (l) {
        const x = () => {
          K(), An.delete(e);
        };
        x.id = -1, An.set(e, x), Ce(x, n);
      } else
        Ws(e), K();
    }
  }
}
function Ws(e) {
  const t = An.get(e);
  t && (t.flags |= 8, An.delete(e));
}
Un().requestIdleCallback;
Un().cancelIdleCallback;
const Mt = (e) => !!e.type.__asyncLoader, si = (e) => e.type.__isKeepAlive;
function Io(e, t) {
  ri(e, "a", t);
}
function Oo(e, t) {
  ri(e, "da", t);
}
function ri(e, t, n = we) {
  const s = e.__wdc || (e.__wdc = () => {
    let r = n;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (Yn(t, s, n), n) {
    let r = n.parent;
    for (; r && r.parent; )
      si(r.parent.vnode) && ko(s, t, n, r), r = r.parent;
  }
}
function ko(e, t, n, s) {
  const r = Yn(
    t,
    e,
    s,
    !0
    /* prepend */
  );
  ii(() => {
    ps(s[t], r);
  }, n);
}
function Yn(e, t, n = we, s = !1) {
  if (n) {
    const r = n[e] || (n[e] = []), i = t.__weh || (t.__weh = (...l) => {
      ot();
      const a = dn(n), o = De(t, n, e, l);
      return a(), lt(), o;
    });
    return s ? r.unshift(i) : r.push(i), i;
  }
}
const ct = (e) => (t, n = we) => {
  (!ln || e === "sp") && Yn(e, (...s) => t(...s), n);
}, Po = ct("bm"), Bn = ct("m"), Mo = ct(
  "bu"
), Lo = ct("u"), Rt = ct(
  "bum"
), ii = ct("um"), Uo = ct(
  "sp"
), No = ct("rtg"), Do = ct("rtc");
function Yo(e, t = we) {
  Yn("ec", e, t);
}
const Bo = /* @__PURE__ */ Symbol.for("v-ndc");
function st(e, t, n, s) {
  let r;
  const i = n, l = B(e);
  if (l || ie(e)) {
    const a = l && /* @__PURE__ */ Ct(e);
    let o = !1, u = !1;
    a && (o = !/* @__PURE__ */ Pe(e), u = /* @__PURE__ */ at(e), e = Nn(e)), r = new Array(e.length);
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
  } else if (Z(e))
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
  if (be.ce || be.parent && Mt(be.parent) && be.parent.ce) {
    const u = n, c = Object.keys(u).length > 0;
    return t !== "default" && (u.name = t), S(), Re(
      ne,
      null,
      [ue("slot", u, s)],
      c ? -2 : 64
    );
  }
  let l = e[t];
  l && l._c && (l._d = !1);
  const a = rt.length;
  S();
  let o;
  try {
    const u = l && oi(l(n)), c = n.key || i || // slot content array of a dynamic conditional slot may have a branch
    // key attached in the `createSlots` helper, respect that
    u && u.key;
    o = Re(
      ne,
      {
        key: (c && !Ue(c) ? c : `_${t}`) + // #7256 force differentiate fallback content from actual content
        (!u && s ? "_fb" : "")
      },
      u || (s ? s() : []),
      u && e._ === 1 ? 64 : -2
    );
  } catch (u) {
    for (let c = rt.length; c > a; c--) Is();
    throw u;
  } finally {
    l && l._c && (l._d = !0);
  }
  return o.scopeId && (o.slotScopeIds = [o.scopeId + "-s"]), o;
}
function oi(e) {
  return e.some((t) => Os(t) ? !(t.type === ut || t.type === ne && !oi(t.children)) : !0) ? e : null;
}
const ls = (e) => e ? xi(e) ? Hn(e) : ls(e.parent) : null, Zt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ oe(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => ls(e.parent),
    $root: (e) => ls(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => ai(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Rs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = fn.bind(e.proxy)),
    $watch: (e) => xo.bind(e)
  })
), Qn = (e, t) => e !== te && !e.__isScriptSetup && z(e, t), Vo = {
  get({ _: e }, t) {
    if (t === "__v_skip")
      return !0;
    const { ctx: n, setupState: s, data: r, props: i, accessCache: l, type: a, appContext: o } = e;
    if (t[0] !== "$") {
      const y = l[t];
      if (y !== void 0)
        switch (y) {
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
        if (Qn(s, t))
          return l[t] = 1, s[t];
        if (r !== te && z(r, t))
          return l[t] = 2, r[t];
        if (z(i, t))
          return l[t] = 3, i[t];
        if (n !== te && z(n, t))
          return l[t] = 4, n[t];
        as && (l[t] = 0);
      }
    }
    const u = Zt[t];
    let c, p;
    if (u)
      return t === "$attrs" && ge(e.attrs, "get", ""), u(e);
    if (
      // css module (injected by vue-loader)
      (c = a.__cssModules) && (c = c[t])
    )
      return c;
    if (n !== te && z(n, t))
      return l[t] = 4, n[t];
    if (
      // global properties
      p = o.config.globalProperties, z(p, t)
    )
      return p[t];
  },
  set({ _: e }, t, n) {
    const { data: s, setupState: r, ctx: i } = e;
    return Qn(r, t) ? (r[t] = n, !0) : s !== te && z(s, t) ? (s[t] = n, !0) : z(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = n, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: n, ctx: s, appContext: r, props: i, type: l }
  }, a) {
    let o;
    return !!(n[a] || e !== te && a[0] !== "$" && z(e, a) || Qn(t, a) || z(i, a) || z(s, a) || z(Zt, a) || z(r.config.globalProperties, a) || (o = l.__cssModules) && o[a]);
  },
  defineProperty(e, t, n) {
    return n.get != null ? e._.accessCache[t] = 0 : z(n, "value") && this.set(e, t, n.value, null), Reflect.defineProperty(e, t, n);
  }
};
function zs(e) {
  return B(e) ? e.reduce(
    (t, n) => (t[n] = null, t),
    {}
  ) : e;
}
let as = !0;
function Fo(e) {
  const t = ai(e), n = e.proxy, s = e.ctx;
  as = !1, t.beforeCreate && Js(t.beforeCreate, e, "bc");
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
    mounted: y,
    beforeUpdate: b,
    updated: I,
    activated: P,
    deactivated: q,
    beforeDestroy: K,
    beforeUnmount: x,
    destroyed: k,
    unmounted: v,
    render: U,
    renderTracked: F,
    renderTriggered: ye,
    errorCaptured: le,
    serverPrefetch: gt,
    // public API
    expose: Me,
    inheritAttrs: ft,
    // assets
    components: xt,
    directives: Tt,
    filters: Vt
  } = t;
  if (u && Ho(u, s, null), l)
    for (const se in l) {
      const Q = l[se];
      j(Q) && (s[se] = Q.bind(n));
    }
  if (r) {
    const se = r.call(n, n);
    Z(se) && (e.data = /* @__PURE__ */ Ss(se));
  }
  if (as = !0, i)
    for (const se in i) {
      const Q = i[se], Qe = j(Q) ? Q.bind(n, n) : j(Q.get) ? Q.get.bind(n, n) : ze, vt = !j(Q) && j(Q.set) ? Q.set.bind(n) : ze, Ye = Ge({
        get: Qe,
        set: vt
      });
      Object.defineProperty(s, se, {
        enumerable: !0,
        configurable: !0,
        get: () => Ye.value,
        set: (Oe) => Ye.value = Oe
      });
    }
  if (a)
    for (const se in a)
      li(a[se], s, n, se);
  if (o) {
    const se = j(o) ? o.call(n) : o;
    Reflect.ownKeys(se).forEach((Q) => {
      Ao(Q, se[Q]);
    });
  }
  c && Js(c, e, "c");
  function fe(se, Q) {
    B(Q) ? Q.forEach((Qe) => se(Qe.bind(n))) : Q && se(Q.bind(n));
  }
  if (fe(Po, p), fe(Bn, y), fe(Mo, b), fe(Lo, I), fe(Io, P), fe(Oo, q), fe(Yo, le), fe(Do, F), fe(No, ye), fe(Rt, x), fe(ii, v), fe(Uo, gt), B(Me))
    if (Me.length) {
      const se = e.exposed || (e.exposed = {});
      Me.forEach((Q) => {
        Object.defineProperty(se, Q, {
          get: () => n[Q],
          set: (Qe) => n[Q] = Qe,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  U && e.render === ze && (e.render = U), ft != null && (e.inheritAttrs = ft), xt && (e.components = xt), Tt && (e.directives = Tt), gt && ni(e);
}
function Ho(e, t, n = ze) {
  B(e) && (e = us(e));
  for (const s in e) {
    const r = e[s];
    let i;
    Z(r) ? "default" in r ? i = yn(
      r.from || s,
      r.default,
      !0
    ) : i = yn(r.from || s) : i = yn(r), /* @__PURE__ */ ve(i) ? Object.defineProperty(t, s, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (l) => i.value = l
    }) : t[s] = i;
  }
}
function Js(e, t, n) {
  De(
    B(e) ? e.map((s) => s.bind(t.proxy)) : e.bind(t.proxy),
    t,
    n
  );
}
function li(e, t, n, s) {
  let r = s.includes(".") ? ei(n, s) : () => n[s];
  if (ie(e)) {
    const i = t[e];
    j(i) && Je(r, i);
  } else if (j(e))
    Je(r, e.bind(n));
  else if (Z(e))
    if (B(e))
      e.forEach((i) => li(i, t, n, s));
    else {
      const i = j(e.handler) ? e.handler.bind(n) : t[e.handler];
      j(i) && Je(r, i, e);
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
    (u) => En(o, u, l, !0)
  ), En(o, t, l)), Z(t) && i.set(t, o), o;
}
function En(e, t, n, s = !1) {
  const { mixins: r, extends: i } = t;
  i && En(e, i, n, !0), r && r.forEach(
    (l) => En(e, l, n, !0)
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
  methods: Wt,
  computed: Wt,
  // lifecycle
  beforeCreate: me,
  created: me,
  beforeMount: me,
  mounted: me,
  beforeUpdate: me,
  updated: me,
  beforeDestroy: me,
  beforeUnmount: me,
  destroyed: me,
  unmounted: me,
  activated: me,
  deactivated: me,
  errorCaptured: me,
  serverPrefetch: me,
  // assets
  components: Wt,
  directives: Wt,
  // watch
  watch: qo,
  // provide / inject
  provide: Qs,
  inject: Ko
};
function Qs(e, t) {
  return t ? e ? function() {
    return oe(
      j(e) ? e.call(this, this) : e,
      j(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function Ko(e, t) {
  return Wt(us(e), us(t));
}
function us(e) {
  if (B(e)) {
    const t = {};
    for (let n = 0; n < e.length; n++)
      t[e[n]] = e[n];
    return t;
  }
  return e;
}
function me(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function Wt(e, t) {
  return e ? oe(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function Xs(e, t) {
  return e ? B(e) && B(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : oe(
    /* @__PURE__ */ Object.create(null),
    zs(e),
    zs(t ?? {})
  ) : t;
}
function qo(e, t) {
  if (!e) return t;
  if (!t) return e;
  const n = oe(/* @__PURE__ */ Object.create(null), e);
  for (const s in t)
    n[s] = me(e[s], t[s]);
  return n;
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
  return function(s, r = null) {
    j(s) || (s = oe({}, s)), r != null && !Z(r) && (r = null);
    const i = ui(), l = /* @__PURE__ */ new WeakSet(), a = [];
    let o = !1;
    const u = i.app = {
      _uid: Wo++,
      _component: s,
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
      mount(c, p, y) {
        if (!o) {
          const b = u._ceVNode || ue(s, r);
          return b.appContext = i, y === !0 ? y = "svg" : y === !1 && (y = void 0), e(b, c, y), o = !0, u._container = c, c.__vue_app__ = u, Hn(b.component);
        }
      },
      onUnmount(c) {
        a.push(c);
      },
      unmount() {
        o && (De(
          a,
          u._instance,
          16
        ), e(null, u._container), delete u._container.__vue_app__);
      },
      provide(c, p) {
        return i.provides[c] = p, u;
      },
      runWithContext(c) {
        const p = Lt;
        Lt = u;
        try {
          return c();
        } finally {
          Lt = p;
        }
      }
    };
    return u;
  };
}
let Lt = null;
const zo = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${Ae(t)}Modifiers`] || e[`${ke(t)}Modifiers`];
function Jo(e, t, ...n) {
  if (e.isUnmounted) return;
  const s = e.vnode.props || te;
  let r = n;
  const i = t.startsWith("update:"), l = i && zo(s, t.slice(7));
  l && (l.trim && (r = n.map((c) => ie(c) ? c.trim() : c)), l.number && (r = n.map(Ln)));
  let a, o = s[a = Kn(t)] || // also try camelCase event handler (#2249)
  s[a = Kn(Ae(t))];
  !o && i && (o = s[a = Kn(ke(t))]), o && De(
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
    e.emitted[a] = !0, De(
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
  if (!j(e)) {
    const o = (u) => {
      const c = ci(u, t, !0);
      c && (a = !0, oe(l, c));
    };
    !n && t.mixins.length && t.mixins.forEach(o), e.extends && o(e.extends), e.mixins && e.mixins.forEach(o);
  }
  return !i && !a ? (Z(e) && s.set(e, null), null) : (B(i) ? i.forEach((o) => l[o] = null) : oe(l, i), Z(e) && s.set(e, l), l);
}
function Vn(e, t) {
  return !e || !On(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), z(e, t[0].toLowerCase() + t.slice(1)) || z(e, ke(t)) || z(e, t));
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
    data: y,
    setupState: b,
    ctx: I,
    inheritAttrs: P
  } = e, q = Sn(e);
  let K, x;
  try {
    if (n.shapeFlag & 4) {
      const v = r || s, U = v;
      K = qe(
        u.call(
          U,
          v,
          c,
          p,
          b,
          y,
          I
        )
      ), x = a;
    } else {
      const v = t;
      K = qe(
        v.length > 1 ? v(
          p,
          { attrs: a, slots: l, emit: o }
        ) : v(
          p,
          null
        )
      ), x = t.props ? a : Xo(a);
    }
  } catch (v) {
    rt.length = 0, Dn(v, e, 1), K = ue(ut);
  }
  let k = K;
  if (x && P !== !1) {
    const v = Object.keys(x), { shapeFlag: U } = k;
    v.length && U & 7 && (i && v.some(kn) && (x = Zo(
      x,
      i
    )), k = Nt(k, x, !1, !0));
  }
  return n.dirs && (k = Nt(k, null, !1, !0), k.dirs = k.dirs ? k.dirs.concat(n.dirs) : n.dirs), n.transition && xs(k, n.transition), K = k, Sn(q), K;
}
const Xo = (e) => {
  let t;
  for (const n in e)
    (n === "class" || n === "style" || On(n)) && ((t || (t = {}))[n] = e[n]);
  return t;
}, Zo = (e, t) => {
  const n = {};
  for (const s in e)
    (!kn(s) || !(s.slice(9) in t)) && (n[s] = e[s]);
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
        const y = c[p];
        if (fi(l, s, y) && !Vn(u, y))
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
    if (fi(t, e, i) && !Vn(n, i))
      return !0;
  }
  return !1;
}
function fi(e, t, n) {
  const s = e[n], r = t[n];
  return n === "style" && Z(s) && Z(r) ? !Bt(s, r) : s !== r;
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
  } = e, a = /* @__PURE__ */ J(r), [o] = e.propsOptions;
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
        let y = c[p];
        if (Vn(e.emitsOptions, y))
          continue;
        const b = t[y];
        if (o)
          if (z(i, y))
            b !== i[y] && (i[y] = b, u = !0);
          else {
            const I = Ae(y);
            r[I] = cs(
              o,
              a,
              I,
              b,
              e,
              !1
            );
          }
        else
          b !== i[y] && (i[y] = b, u = !0);
      }
    }
  } else {
    gi(e, t, r, i) && (u = !0);
    let c;
    for (const p in a)
      (!t || // for camelCase
      !z(t, p) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((c = ke(p)) === p || !z(t, c))) && (o ? n && // for camelCase
      (n[p] !== void 0 || // for kebab-case
      n[c] !== void 0) && (r[p] = cs(
        o,
        a,
        p,
        void 0,
        e,
        !0
      )) : delete r[p]);
    if (i !== a)
      for (const p in i)
        (!t || !z(t, p)) && (delete i[p], u = !0);
  }
  u && tt(e.attrs, "set", "");
}
function gi(e, t, n, s) {
  const [r, i] = e.propsOptions;
  let l = !1, a;
  if (t)
    for (let o in t) {
      if (zt(o))
        continue;
      const u = t[o];
      let c;
      r && z(r, c = Ae(o)) ? !i || !i.includes(c) ? n[c] = u : (a || (a = {}))[c] = u : Vn(e.emitsOptions, o) || (!(o in s) || u !== s[o]) && (s[o] = u, l = !0);
    }
  if (i) {
    const o = /* @__PURE__ */ J(n), u = a || te;
    for (let c = 0; c < i.length; c++) {
      const p = i[c];
      n[p] = cs(
        r,
        o,
        p,
        u[p],
        e,
        !z(u, p)
      );
    }
  }
  return l;
}
function cs(e, t, n, s, r, i) {
  const l = e[n];
  if (l != null) {
    const a = z(l, "default");
    if (a && s === void 0) {
      const o = l.default;
      if (l.type !== Function && !l.skipFactory && j(o)) {
        const { propsDefaults: u } = r;
        if (n in u)
          s = u[n];
        else {
          const c = dn(r);
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
    ] && (s === "" || s === ke(n)) && (s = !0));
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
  if (!j(e)) {
    const c = (p) => {
      o = !0;
      const [y, b] = bi(p, t, !0);
      oe(l, y), b && a.push(...b);
    };
    !n && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  if (!i && !o)
    return Z(e) && s.set(e, Ot), Ot;
  if (B(i))
    for (let c = 0; c < i.length; c++) {
      const p = Ae(i[c]);
      tr(p) && (l[p] = te);
    }
  else if (i)
    for (const c in i) {
      const p = Ae(c);
      if (tr(p)) {
        const y = i[c], b = l[p] = B(y) || j(y) ? { type: y } : oe({}, y), I = b.type;
        let P = !1, q = !0;
        if (B(I))
          for (let K = 0; K < I.length; ++K) {
            const x = I[K], k = j(x) && x.name;
            if (k === "Boolean") {
              P = !0;
              break;
            } else k === "String" && (q = !1);
          }
        else
          P = j(I) && I.name === "Boolean";
        b[
          0
          /* shouldCast */
        ] = P, b[
          1
          /* shouldCastTrue */
        ] = q, (P || z(b, "default")) && a.push(p);
      }
    }
  const u = [l, a];
  return Z(e) && s.set(e, u), u;
}
function tr(e) {
  return e[0] !== "$" && !zt(e);
}
const Ts = (e) => e === "_" || e === "_ctx" || e === "$stable", $s = (e) => B(e) ? e.map(qe) : [qe(e)], il = (e, t, n) => {
  if (t._n)
    return t;
  const s = At((...r) => $s(t(...r)), n);
  return s._c = !1, s;
}, vi = (e, t, n) => {
  const s = e._ctx;
  for (const r in e) {
    if (Ts(r)) continue;
    const i = e[r];
    if (j(i))
      t[r] = il(r, i, s);
    else if (i != null) {
      const l = $s(i);
      t[r] = () => l;
    }
  }
}, yi = (e, t) => {
  const n = $s(t);
  e.slots.default = () => n;
}, mi = (e, t, n) => {
  for (const s in t)
    (n || !Ts(s)) && (e[s] = t[s]);
}, ol = (e, t, n) => {
  const s = e.slots = hi();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (mi(s, t, n), n && Tr(s, "_", r, !0)) : vi(t, s);
  } else t && yi(e, t);
}, ll = (e, t, n) => {
  const { vnode: s, slots: r } = e;
  let i = !0, l = te;
  if (s.shapeFlag & 32) {
    const a = t._;
    a ? n && a === 1 ? i = !1 : mi(r, t, n) : (i = !t.$stable, vi(t, r)), l = t;
  } else t && (yi(e, t), l = { default: 1 });
  if (i)
    for (const a in r)
      !Ts(a) && l[a] == null && delete r[a];
}, Ce = dl;
function al(e) {
  return ul(e);
}
function ul(e, t) {
  const n = Un();
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
    nextSibling: y,
    setScopeId: b = ze,
    insertStaticContent: I
  } = e, P = (f, h, g, C = null, w = null, m = null, $ = void 0, E = null, A = !!h.dynamicChildren) => {
    if (f === h)
      return;
    f && !Kt(f, h) && (C = de(f), Oe(f, w, m, !0), f = null), h.patchFlag === -2 && (A = !1, h.dynamicChildren = null);
    const { type: _, ref: Y, shapeFlag: O } = h;
    switch (_) {
      case Fn:
        q(f, h, g, C);
        break;
      case ut:
        K(f, h, g, C);
        break;
      case Zn:
        f == null && x(h, g, C, $);
        break;
      case ne:
        xt(
          f,
          h,
          g,
          C,
          w,
          m,
          $,
          E,
          A
        );
        break;
      default:
        O & 1 ? U(
          f,
          h,
          g,
          C,
          w,
          m,
          $,
          E,
          A
        ) : O & 6 ? Tt(
          f,
          h,
          g,
          C,
          w,
          m,
          $,
          E,
          A
        ) : (O & 64 || O & 128) && _.process(
          f,
          h,
          g,
          C,
          w,
          m,
          $,
          E,
          A,
          Ft
        );
    }
    Y != null && w ? Xt(Y, f && f.ref, m, h || f, !h) : Y == null && f && f.ref != null && Xt(f.ref, null, m, f, !0);
  }, q = (f, h, g, C) => {
    if (f == null)
      s(
        h.el = a(h.children),
        g,
        C
      );
    else {
      const w = h.el = f.el;
      h.children !== f.children && u(w, h.children);
    }
  }, K = (f, h, g, C) => {
    f == null ? s(
      h.el = o(h.children || ""),
      g,
      C
    ) : h.el = f.el;
  }, x = (f, h, g, C) => {
    [f.el, f.anchor] = I(
      f.children,
      h,
      g,
      C,
      f.el,
      f.anchor
    );
  }, k = ({ el: f, anchor: h }, g, C) => {
    let w;
    for (; f && f !== h; )
      w = y(f), s(f, g, C), f = w;
    s(h, g, C);
  }, v = ({ el: f, anchor: h }) => {
    let g;
    for (; f && f !== h; )
      g = y(f), r(f), f = g;
    r(h);
  }, U = (f, h, g, C, w, m, $, E, A) => {
    if (h.type === "svg" ? $ = "svg" : h.type === "math" && ($ = "mathml"), f == null)
      F(
        h,
        g,
        C,
        w,
        m,
        $,
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
          $,
          E,
          A
        );
      } finally {
        _ && _._endPatch();
      }
    }
  }, F = (f, h, g, C, w, m, $, E) => {
    let A, _;
    const { props: Y, shapeFlag: O, transition: D, dirs: V } = f;
    if (A = f.el = l(
      f.type,
      m,
      Y && Y.is,
      Y
    ), O & 8 ? c(A, f.children) : O & 16 && le(
      f.children,
      A,
      null,
      C,
      w,
      Xn(f, m),
      $,
      E
    ), V && yt(f, null, C, "created"), ye(A, f, f.scopeId, $, C), Y) {
      for (const ee in Y)
        ee !== "value" && !zt(ee) && i(A, ee, null, Y[ee], m, C);
      "value" in Y && i(A, "value", null, Y.value, m), (_ = Y.onVnodeBeforeMount) && He(_, C, f);
    }
    V && yt(f, null, C, "beforeMount");
    const W = cl(w, D);
    W && D.beforeEnter(A), s(A, h, g), ((_ = Y && Y.onVnodeMounted) || W || V) && Ce(() => {
      try {
        _ && He(_, C, f), W && D.enter(A), V && yt(f, null, C, "mounted");
      } finally {
      }
    }, w);
  }, ye = (f, h, g, C, w) => {
    if (g && b(f, g), C)
      for (let m = 0; m < C.length; m++)
        b(f, C[m]);
    if (w) {
      let m = w.subTree;
      if (h === m || Si(m.type) && (m.ssContent === h || m.ssFallback === h)) {
        const $ = w.vnode;
        ye(
          f,
          $,
          $.scopeId,
          $.slotScopeIds,
          w.parent
        );
      }
    }
  }, le = (f, h, g, C, w, m, $, E, A = 0) => {
    for (let _ = A; _ < f.length; _++) {
      const Y = f[_] = E ? et(f[_]) : qe(f[_]);
      P(
        null,
        Y,
        h,
        g,
        C,
        w,
        m,
        $,
        E
      );
    }
  }, gt = (f, h, g, C, w, m, $) => {
    const E = h.el = f.el;
    let { patchFlag: A, dynamicChildren: _, dirs: Y } = h;
    A |= f.patchFlag & 16;
    const O = f.props || te, D = h.props || te;
    let V;
    if (g && mt(g, !1), (V = D.onVnodeBeforeUpdate) && He(V, g, h, f), Y && yt(h, f, g, "beforeUpdate"), g && mt(g, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    _ && (!f.dynamicChildren || f.dynamicChildren.length !== _.length) && (A = 0, $ = !1, _ = null), (O.innerHTML && D.innerHTML == null || O.textContent && D.textContent == null) && c(E, ""), _ ? Me(
      f.dynamicChildren,
      _,
      E,
      g,
      C,
      Xn(h, w),
      m
    ) : $ || Q(
      f,
      h,
      E,
      null,
      g,
      C,
      Xn(h, w),
      m,
      !1
    ), A > 0) {
      if (A & 16)
        ft(E, O, D, g, w);
      else if (A & 2 && O.class !== D.class && i(E, "class", null, D.class, w), A & 4 && i(E, "style", O.style, D.style, w), A & 8) {
        const W = h.dynamicProps;
        for (let ee = 0; ee < W.length; ee++) {
          const X = W[ee], ae = O[X], he = D[X];
          (he !== ae || X === "value") && i(E, X, ae, he, w, g);
        }
      }
      A & 1 && f.children !== h.children && c(E, h.children);
    } else !$ && _ == null && ft(E, O, D, g, w);
    ((V = D.onVnodeUpdated) || Y) && Ce(() => {
      V && He(V, g, h, f), Y && yt(h, f, g, "updated");
    }, C);
  }, Me = (f, h, g, C, w, m, $) => {
    for (let E = 0; E < h.length; E++) {
      const A = f[E], _ = h[E], Y = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        A.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (A.type === ne || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !Kt(A, _) || // - In the case of a component, it could contain anything.
        A.shapeFlag & 198) ? p(A.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          g
        )
      );
      P(
        A,
        _,
        Y,
        null,
        C,
        w,
        m,
        $,
        !0
      );
    }
  }, ft = (f, h, g, C, w) => {
    if (h !== g) {
      if (h !== te)
        for (const m in h)
          !zt(m) && !(m in g) && i(
            f,
            m,
            h[m],
            null,
            w,
            C
          );
      for (const m in g) {
        if (zt(m)) continue;
        const $ = g[m], E = h[m];
        $ !== E && m !== "value" && i(f, m, E, $, w, C);
      }
      "value" in g && i(f, "value", h.value, g.value, w);
    }
  }, xt = (f, h, g, C, w, m, $, E, A) => {
    const _ = h.el = f ? f.el : a(""), Y = h.anchor = f ? f.anchor : a("");
    let { patchFlag: O, dynamicChildren: D, slotScopeIds: V } = h;
    V && (E = E ? E.concat(V) : V), f == null ? (s(_, g, C), s(Y, g, C), le(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      h.children || [],
      g,
      Y,
      w,
      m,
      $,
      E,
      A
    )) : O > 0 && O & 64 && D && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    f.dynamicChildren && f.dynamicChildren.length === D.length ? (Me(
      f.dynamicChildren,
      D,
      g,
      w,
      m,
      $,
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
    )) : Q(
      f,
      h,
      g,
      Y,
      w,
      m,
      $,
      E,
      A
    );
  }, Tt = (f, h, g, C, w, m, $, E, A) => {
    h.slotScopeIds = E, f == null ? h.shapeFlag & 512 ? w.ctx.activate(
      h,
      g,
      C,
      $,
      A
    ) : Vt(
      h,
      g,
      C,
      w,
      m,
      $,
      A
    ) : bt(f, h, A);
  }, Vt = (f, h, g, C, w, m, $) => {
    const E = f.component = yl(
      f,
      C,
      w
    );
    if (si(f) && (E.ctx.renderer = Ft), ml(E, !1, $), E.asyncDep) {
      if (w && w.registerDep(E, fe, $), !f.el) {
        const A = E.subTree = ue(ut);
        K(null, A, h, g), f.placeholder = A.el;
      }
    } else
      fe(
        E,
        f,
        h,
        g,
        w,
        m,
        $
      );
  }, bt = (f, h, g) => {
    const C = h.component = f.component;
    if (el(f, h, g))
      if (C.asyncDep && !C.asyncResolved) {
        se(C, h, g);
        return;
      } else
        C.next = h, C.update();
    else
      h.el = f.el, C.vnode = h;
  }, fe = (f, h, g, C, w, m, $) => {
    const E = () => {
      if (f.isMounted) {
        let { next: O, bu: D, u: V, parent: W, vnode: ee } = f;
        {
          const Ve = wi(f);
          if (Ve) {
            O && (O.el = ee.el, se(f, O, $)), Ve.asyncDep.then(() => {
              Ce(() => {
                f.isUnmounted || _();
              }, w);
            });
            return;
          }
        }
        let X = O, ae;
        mt(f, !1), O ? (O.el = ee.el, se(f, O, $)) : O = ee, D && vn(D), (ae = O.props && O.props.onVnodeBeforeUpdate) && He(ae, W, O, ee), mt(f, !0);
        const he = Zs(f), Be = f.subTree;
        f.subTree = he, P(
          Be,
          he,
          // parent may have changed if it's in a teleport
          p(Be.el),
          // anchor may have changed if it's in a fragment
          de(Be),
          f,
          w,
          m
        ), O.el = he.el, X === null && tl(f, he.el), V && Ce(V, w), (ae = O.props && O.props.onVnodeUpdated) && Ce(
          () => He(ae, W, O, ee),
          w
        );
      } else {
        let O;
        const { el: D, props: V } = h, { bm: W, m: ee, parent: X, root: ae, type: he } = f, Be = Mt(h);
        mt(f, !1), W && vn(W), !Be && (O = V && V.onVnodeBeforeMount) && He(O, X, h), mt(f, !0);
        {
          ae.ce && ae.ce._hasShadowRoot() && ae.ce._injectChildStyle(
            he,
            f.parent ? f.parent.type : void 0
          );
          const Ve = f.subTree = Zs(f);
          P(
            null,
            Ve,
            g,
            C,
            f,
            w,
            m
          ), h.el = Ve.el;
        }
        if (ee && Ce(ee, w), !Be && (O = V && V.onVnodeMounted)) {
          const Ve = h;
          Ce(
            () => He(O, X, Ve),
            w
          );
        }
        (h.shapeFlag & 256 || X && Mt(X.vnode) && X.vnode.shapeFlag & 256) && f.a && Ce(f.a, w), f.isMounted = !0, h = g = C = null;
      }
    };
    f.scope.on();
    const A = f.effect = new kr(E);
    f.scope.off();
    const _ = f.update = A.run.bind(A), Y = f.job = A.runIfDirty.bind(A);
    Y.i = f, Y.id = f.uid, A.scheduler = () => Rs(Y), mt(f, !0), _();
  }, se = (f, h, g) => {
    h.component = f;
    const C = f.vnode.props;
    f.vnode = h, f.next = null, sl(f, h.props, C, g), ll(f, h.children, g), ot(), Ks(f), lt();
  }, Q = (f, h, g, C, w, m, $, E, A = !1) => {
    const _ = f && f.children, Y = f ? f.shapeFlag : 0, O = h.children, { patchFlag: D, shapeFlag: V } = h;
    if (D > 0) {
      if (D & 128) {
        vt(
          _,
          O,
          g,
          C,
          w,
          m,
          $,
          E,
          A
        );
        return;
      } else if (D & 256) {
        Qe(
          _,
          O,
          g,
          C,
          w,
          m,
          $,
          E,
          A
        );
        return;
      }
    }
    V & 8 ? (Y & 16 && L(_, w, m), O !== _ && c(g, O)) : Y & 16 ? V & 16 ? vt(
      _,
      O,
      g,
      C,
      w,
      m,
      $,
      E,
      A
    ) : L(_, w, m, !0) : (Y & 8 && c(g, ""), V & 16 && le(
      O,
      g,
      C,
      w,
      m,
      $,
      E,
      A
    ));
  }, Qe = (f, h, g, C, w, m, $, E, A) => {
    f = f || Ot, h = h || Ot;
    const _ = f.length, Y = h.length, O = Math.min(_, Y);
    let D;
    for (D = 0; D < O; D++) {
      const V = h[D] = A ? et(h[D]) : qe(h[D]);
      P(
        f[D],
        V,
        g,
        null,
        w,
        m,
        $,
        E,
        A
      );
    }
    _ > Y ? L(
      f,
      w,
      m,
      !0,
      !1,
      O
    ) : le(
      h,
      g,
      C,
      w,
      m,
      $,
      E,
      A,
      O
    );
  }, vt = (f, h, g, C, w, m, $, E, A) => {
    let _ = 0;
    const Y = h.length;
    let O = f.length - 1, D = Y - 1;
    for (; _ <= O && _ <= D; ) {
      const V = f[_], W = h[_] = A ? et(h[_]) : qe(h[_]);
      if (Kt(V, W))
        P(
          V,
          W,
          g,
          null,
          w,
          m,
          $,
          E,
          A
        );
      else
        break;
      _++;
    }
    for (; _ <= O && _ <= D; ) {
      const V = f[O], W = h[D] = A ? et(h[D]) : qe(h[D]);
      if (Kt(V, W))
        P(
          V,
          W,
          g,
          null,
          w,
          m,
          $,
          E,
          A
        );
      else
        break;
      O--, D--;
    }
    if (_ > O) {
      if (_ <= D) {
        const V = D + 1, W = V < Y ? h[V].el : C;
        for (; _ <= D; )
          P(
            null,
            h[_] = A ? et(h[_]) : qe(h[_]),
            g,
            W,
            w,
            m,
            $,
            E,
            A
          ), _++;
      }
    } else if (_ > D)
      for (; _ <= O; )
        Oe(f[_], w, m, !0), _++;
    else {
      const V = _, W = _, ee = /* @__PURE__ */ new Map();
      for (_ = W; _ <= D; _++) {
        const Ee = h[_] = A ? et(h[_]) : qe(h[_]);
        Ee.key != null && ee.set(Ee.key, _);
      }
      let X, ae = 0;
      const he = D - W + 1;
      let Be = !1, Ve = 0;
      const Ht = new Array(he);
      for (_ = 0; _ < he; _++) Ht[_] = 0;
      for (_ = V; _ <= O; _++) {
        const Ee = f[_];
        if (ae >= he) {
          Oe(Ee, w, m, !0);
          continue;
        }
        let Fe;
        if (Ee.key != null)
          Fe = ee.get(Ee.key);
        else
          for (X = W; X <= D; X++)
            if (Ht[X - W] === 0 && Kt(Ee, h[X])) {
              Fe = X;
              break;
            }
        Fe === void 0 ? Oe(Ee, w, m, !0) : (Ht[Fe - W] = _ + 1, Fe >= Ve ? Ve = Fe : Be = !0, P(
          Ee,
          h[Fe],
          g,
          null,
          w,
          m,
          $,
          E,
          A
        ), ae++);
      }
      const Ns = Be ? fl(Ht) : Ot;
      for (X = Ns.length - 1, _ = he - 1; _ >= 0; _--) {
        const Ee = W + _, Fe = h[Ee], Ds = h[Ee + 1], Ys = Ee + 1 < Y ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          Ds.el || Ci(Ds)
        ) : C;
        Ht[_] === 0 ? P(
          null,
          Fe,
          g,
          Ys,
          w,
          m,
          $,
          E,
          A
        ) : Be && (X < 0 || _ !== Ns[X] ? Ye(Fe, g, Ys, 2) : X--);
      }
    }
  }, Ye = (f, h, g, C, w = null) => {
    const { el: m, type: $, transition: E, children: A, shapeFlag: _ } = f;
    if (_ & 6) {
      Ye(f.component.subTree, h, g, C);
      return;
    }
    if (_ & 128) {
      f.suspense.move(h, g, C);
      return;
    }
    if (_ & 64) {
      $.move(f, h, g, Ft);
      return;
    }
    if ($ === ne) {
      s(m, h, g);
      for (let O = 0; O < A.length; O++)
        Ye(A[O], h, g, C);
      s(f.anchor, h, g);
      return;
    }
    if ($ === Zn) {
      k(f, h, g);
      return;
    }
    if (C !== 2 && _ & 1 && E)
      if (C === 0)
        E.persisted && !m[Jn] ? s(m, h, g) : (E.beforeEnter(m), s(m, h, g), Ce(() => E.enter(m), w));
      else {
        const { leave: O, delayLeave: D, afterLeave: V } = E, W = () => {
          f.ctx.isUnmounted ? r(m) : s(m, h, g);
        }, ee = () => {
          const X = m._isLeaving || !!m[Jn];
          m._isLeaving && m[Jn](
            !0
            /* cancelled */
          ), E.persisted && !X ? W() : O(m, () => {
            W(), V && V();
          });
        };
        D ? D(m, W, ee) : ee();
      }
    else
      s(m, h, g);
  }, Oe = (f, h, g, C = !1, w = !1) => {
    const {
      type: m,
      props: $,
      ref: E,
      children: A,
      dynamicChildren: _,
      shapeFlag: Y,
      patchFlag: O,
      dirs: D,
      cacheIndex: V,
      memo: W
    } = f;
    if (O === -2 && (w = !1), E != null && (ot(), Xt(E, null, g, f, !0), lt()), V != null && (h.renderCache[V] = void 0), Y & 256) {
      h.ctx.deactivate(f);
      return;
    }
    const ee = Y & 1 && D, X = !Mt(f);
    let ae;
    if (X && (ae = $ && $.onVnodeBeforeUnmount) && He(ae, h, f), Y & 6)
      R(f.component, g, C);
    else {
      if (Y & 128) {
        f.suspense.unmount(g, C);
        return;
      }
      ee && yt(f, null, h, "beforeUnmount"), Y & 64 ? f.type.remove(
        f,
        h,
        g,
        Ft,
        C
      ) : _ && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !_.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (m !== ne || O > 0 && O & 64) ? L(
        _,
        h,
        g,
        !1,
        !0
      ) : (m === ne && O & 384 || !w && Y & 16) && L(A, h, g), C && hn(f);
    }
    const he = W != null && V == null;
    (X && (ae = $ && $.onVnodeUnmounted) || ee || he) && Ce(() => {
      ae && He(ae, h, f), ee && yt(f, null, h, "unmounted"), he && (f.el = null);
    }, g);
  }, hn = (f) => {
    const { type: h, el: g, anchor: C, transition: w } = f;
    if (h === ne) {
      N(g, C);
      return;
    }
    if (h === Zn) {
      v(f);
      return;
    }
    const m = () => {
      r(g), w && !w.persisted && w.afterLeave && w.afterLeave();
    };
    if (f.shapeFlag & 1 && w && !w.persisted) {
      const { leave: $, delayLeave: E } = w, A = () => $(g, m);
      E ? E(f.el, m, A) : A();
    } else
      m();
  }, N = (f, h) => {
    let g;
    for (; f !== h; )
      g = y(f), r(f), f = g;
    r(h);
  }, R = (f, h, g) => {
    const { bum: C, scope: w, job: m, subTree: $, um: E, m: A, a: _ } = f;
    nr(A), nr(_), C && vn(C), w.stop(), m && (m.flags |= 8, Oe($, f, h, g)), E && Ce(E, h), Ce(() => {
      f.isUnmounted = !0;
    }, h);
  }, L = (f, h, g, C = !1, w = !1, m = 0) => {
    for (let $ = m; $ < f.length; $++)
      Oe(f[$], h, g, C, w);
  }, de = (f) => {
    if (f.shapeFlag & 6)
      return de(f.component.subTree);
    if (f.shapeFlag & 128)
      return f.suspense.next();
    const h = y(f.anchor || f.el), g = h && h[To];
    return g ? y(g) : h;
  };
  let dt = !1;
  const Us = (f, h, g) => {
    let C;
    f == null ? h._vnode && (Oe(h._vnode, null, null, !0), C = h._vnode.component) : P(
      h._vnode || null,
      f,
      h,
      null,
      null,
      null,
      g
    ), h._vnode = f, dt || (dt = !0, Ks(C), Jr(), dt = !1);
  }, Ft = {
    p: P,
    um: Oe,
    m: Ye,
    r: hn,
    mt: Vt,
    mc: le,
    pc: Q,
    pbc: Me,
    n: de,
    o: e
  };
  return {
    render: Us,
    hydrate: void 0,
    createApp: Go(Us)
  };
}
function Xn({ type: e, props: t }, n) {
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
  if (B(s) && B(r))
    for (let i = 0; i < s.length; i++) {
      const l = s[i];
      let a = r[i];
      a.shapeFlag & 1 && !a.dynamicChildren && ((a.patchFlag <= 0 || a.patchFlag === 32) && (a = r[i] = et(r[i]), a.el = l.el), !n && a.patchFlag !== -2 && _i(l, a)), a.type === Fn && (a.patchFlag === -1 && (a = r[i] = et(a)), a.el = l.el), a.type === ut && !a.el && (a.el = l.el);
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
function Ci(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Ci(t.subTree) : null;
}
const Si = (e) => e.__isSuspense;
function dl(e, t) {
  t && t.pendingBranch ? B(e) ? t.effects.push(...e) : t.effects.push(e) : So(e);
}
const ne = /* @__PURE__ */ Symbol.for("v-fgt"), Fn = /* @__PURE__ */ Symbol.for("v-txt"), ut = /* @__PURE__ */ Symbol.for("v-cmt"), Zn = /* @__PURE__ */ Symbol.for("v-stc"), rt = [];
let xe = null;
function S(e = !1) {
  rt.push(xe = e ? null : []);
}
function Is() {
  rt.pop(), xe = rt[rt.length - 1] || null;
}
let on = 1;
function sr(e, t = !1) {
  on += e, e < 0 && xe && t && (xe.hasOnce = !0);
}
function Ai(e) {
  return e.dynamicChildren = on > 0 ? xe || Ot : null, Is(), on > 0 && xe && xe.push(e), e;
}
function T(e, t, n, s, r, i) {
  return Ai(
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
function Re(e, t, n, s, r) {
  return Ai(
    ue(
      e,
      t,
      n,
      s,
      r,
      !0
    )
  );
}
function Os(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function Kt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const Ei = ({ key: e }) => e ?? null, mn = ({
  ref: e,
  ref_key: t,
  ref_for: n
}) => (typeof e == "number" && (e = "" + e), e != null ? ie(e) || /* @__PURE__ */ ve(e) || j(e) ? { i: be, r: e, k: t, f: !!n } : e : null);
function d(e, t = null, n = null, s = 0, r = null, i = e === ne ? 0 : 1, l = !1, a = !1) {
  const o = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Ei(t),
    ref: t && mn(t),
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
    ctx: be
  };
  return a ? (Rn(o, n), i & 128 && e.normalize(o)) : n && (o.shapeFlag |= ie(n) ? 8 : 16), on > 0 && // avoid a block node from tracking itself
  !l && // has current parent block
  xe && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (o.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  o.patchFlag !== 32 && xe.push(o), o;
}
const ue = hl;
function hl(e, t = null, n = null, s = 0, r = null, i = !1) {
  if ((!e || e === Bo) && (e = ut), Os(e)) {
    const a = Nt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return n && Rn(a, n), on > 0 && !i && xe && (a.shapeFlag & 6 ? xe[xe.indexOf(e)] = a : xe.push(a)), a.patchFlag = -2, a;
  }
  if (Sl(e) && (e = e.__vccOpts), t) {
    t = pl(t);
    let { class: a, style: o } = t;
    a && !ie(a) && (t.class = Et(a)), Z(o) && (/* @__PURE__ */ Es(o) && !B(o) && (o = oe({}, o)), t.style = bs(o));
  }
  const l = ie(e) ? 1 : Si(e) ? 128 : $o(e) ? 64 : Z(e) ? 4 : j(e) ? 2 : 0;
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
  return e ? /* @__PURE__ */ Es(e) || pi(e) ? oe({}, e) : e : null;
}
function Nt(e, t, n = !1, s = !1) {
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
      n && i ? B(i) ? i.concat(mn(t)) : [i, mn(t)] : mn(t)
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
    patchFlag: t && e.type !== ne ? l === -1 ? 16 : l | 16 : l,
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
    ssContent: e.ssContent && Nt(e.ssContent),
    ssFallback: e.ssFallback && Nt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return o && s && xs(
    c,
    o.clone(c)
  ), c;
}
function ce(e = " ", t = 0) {
  return ue(Fn, null, e, t);
}
function G(e = "", t = !1) {
  return t ? (S(), Re(ut, null, e)) : ue(ut, null, e);
}
function qe(e) {
  return e == null || typeof e == "boolean" ? ue(ut) : B(e) ? ue(
    ne,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : Os(e) ? et(e) : ue(Fn, null, String(e));
}
function et(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : Nt(e);
}
function Rn(e, t) {
  let n = 0;
  const { shapeFlag: s } = e;
  if (t == null)
    t = null;
  else if (B(t))
    n = 16;
  else if (typeof t == "object")
    if (s & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), Rn(e, r()), r._c && (r._d = !0));
      return;
    } else {
      n = 32;
      const r = t._;
      !r && !pi(t) ? t._ctx = be : r === 3 && be && (be.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (j(t)) {
    if (s & 65) {
      Rn(e, { default: t });
      return;
    }
    t = { default: t, _ctx: be }, n = 32;
  } else
    t = String(t), s & 64 ? (n = 16, t = [ce(t)]) : n = 8;
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
        t.style = bs([t.style, s.style]);
      else if (On(r)) {
        const i = t[r], l = s[r];
        l && i !== l && !(B(i) && i.includes(l)) ? t[r] = i ? [].concat(i, l) : l : l == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !kn(r) && (t[r] = l);
      } else r !== "" && (t[r] = s[r]);
  }
  return t;
}
function He(e, t, n, s = null) {
  De(e, t, 7, [
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
    propsDefaults: te,
    // inheritAttrs
    inheritAttrs: s.inheritAttrs,
    // state
    ctx: te,
    data: te,
    props: te,
    attrs: te,
    slots: te,
    refs: te,
    setupState: te,
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = Jo.bind(null, i), e.ce && e.ce(i), i;
}
let we = null;
const Ri = () => we || be;
let xn, fs;
{
  const e = Un(), t = (n, s) => {
    let r;
    return (r = e[n]) || (r = e[n] = []), r.push(s), (i) => {
      r.length > 1 ? r.forEach((l) => l(i)) : r[0](i);
    };
  };
  xn = t(
    "__VUE_INSTANCE_SETTERS__",
    (n) => we = n
  ), fs = t(
    "__VUE_SSR_SETTERS__",
    (n) => ln = n
  );
}
const dn = (e) => {
  const t = we;
  return xn(e), e.scope.on(), () => {
    e.scope.off(), xn(t);
  };
}, rr = () => {
  we && we.scope.off(), xn(null);
};
function xi(e) {
  return e.vnode.shapeFlag & 4;
}
let ln = !1;
function ml(e, t = !1, n = !1) {
  t && fs(t);
  const { props: s, children: r } = e.vnode, i = xi(e);
  nl(e, s, i, t), ol(e, r, n || t);
  const l = i ? _l(e, t) : void 0;
  return t && fs(!1), l;
}
function _l(e, t) {
  const n = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, Vo);
  const { setup: s } = n;
  if (s) {
    ot();
    const r = e.setupContext = s.length > 1 ? Cl(e) : null, i = dn(e), l = cn(
      s,
      e,
      0,
      [
        e.props,
        r
      ]
    ), a = Er(l);
    if (lt(), i(), (a || e.sp) && !Mt(e) && ni(e), a) {
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
  j(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : Z(t) && (e.setupState = Wr(t)), Ti(e);
}
function Ti(e, t, n) {
  const s = e.type;
  e.render || (e.render = s.render || ze);
  {
    const r = dn(e);
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
    return ge(e, "get", ""), e[t];
  }
};
function Cl(e) {
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
function Hn(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(Wr(ho(e.exposed)), {
    get(t, n) {
      if (n in t)
        return t[n];
      if (n in Zt)
        return Zt[n](e);
    },
    has(t, n) {
      return n in t || n in Zt;
    }
  })) : e.proxy;
}
function Sl(e) {
  return j(e) && "__vccOpts" in e;
}
const Ge = (e, t) => /* @__PURE__ */ yo(e, t, ln), Al = "3.5.40";
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let ds;
const or = typeof window < "u" && window.trustedTypes;
if (or)
  try {
    ds = /* @__PURE__ */ or.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const $i = ds ? (e) => ds.createHTML(e) : (e) => e, El = "http://www.w3.org/2000/svg", Rl = "http://www.w3.org/1998/Math/MathML", Ze = typeof document < "u" ? document : null, lr = Ze && /* @__PURE__ */ Ze.createElement("template"), xl = {
  insert: (e, t, n) => {
    t.insertBefore(e, n || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, n, s) => {
    const r = t === "svg" ? Ze.createElementNS(El, e) : t === "mathml" ? Ze.createElementNS(Rl, e) : n ? Ze.createElement(e, { is: n }) : Ze.createElement(e);
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
const Tn = /* @__PURE__ */ Symbol("_vod"), Ii = /* @__PURE__ */ Symbol("_vsh"), Il = {
  // used for prop mismatch check during hydration
  name: "show",
  beforeMount(e, { value: t }, { transition: n }) {
    e[Tn] = e.style.display === "none" ? "" : e.style.display, n && t ? n.beforeEnter(e) : qt(e, t);
  },
  mounted(e, { value: t }, { transition: n }) {
    n && t && n.enter(e);
  },
  updated(e, { value: t, oldValue: n }, { transition: s }) {
    !t != !n && (s ? t ? (s.beforeEnter(e), qt(e, !0), s.enter(e)) : s.leave(e, () => {
      qt(e, !1);
    }) : qt(e, t));
  },
  beforeUnmount(e, { value: t }) {
    qt(e, t);
  }
};
function qt(e, t) {
  e.style.display = t ? e[Tn] : "none", e[Ii] = !t;
}
const Ol = /* @__PURE__ */ Symbol(""), kl = /(?:^|;)\s*display\s*:/;
function Pl(e, t, n) {
  const s = e.style, r = ie(n);
  let i = !1;
  if (n && !r) {
    if (t)
      if (ie(t))
        for (const l of t.split(";")) {
          const a = l.slice(0, l.indexOf(":")).trim();
          n[a] == null && Gt(s, a, "");
        }
      else
        for (const l in t)
          n[l] == null && Gt(s, l, "");
    for (const l in n) {
      l === "display" && (i = !0);
      const a = n[l];
      a != null ? Ll(
        e,
        l,
        !ie(t) && t ? t[l] : void 0,
        a
      ) || Gt(s, l, a) : Gt(s, l, "");
    }
  } else if (r) {
    if (t !== n) {
      const l = s[Ol];
      l && (n += ";" + l), s.cssText = n, i = kl.test(n);
    }
  } else t && e.removeAttribute("style");
  Tn in e && (e[Tn] = i ? s.display : "", e[Ii] && (s.display = "none"));
}
const ar = /\s*!important$/;
function Gt(e, t, n) {
  if (B(n))
    n.forEach((s) => Gt(e, t, s));
  else if (n == null && (n = ""), t.startsWith("--"))
    e.setProperty(t, n);
  else {
    const s = Ml(e, t);
    ar.test(n) ? e.setProperty(
      ke(s),
      n.replace(ar, ""),
      "important"
    ) : e[s] = n;
  }
}
const ur = ["Webkit", "Moz", "ms"], es = {};
function Ml(e, t) {
  const n = es[t];
  if (n)
    return n;
  let s = Ae(t);
  if (s !== "filter" && s in e)
    return es[t] = s;
  s = xr(s);
  for (let r = 0; r < ur.length; r++) {
    const i = ur[r] + s;
    if (i in e)
      return es[t] = i;
  }
  return t;
}
function Ll(e, t, n, s) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && ie(s) && n === s;
}
const cr = "http://www.w3.org/1999/xlink";
function fr(e, t, n, s, r, i = ji(t)) {
  s && t.startsWith("xlink:") ? n == null ? e.removeAttributeNS(cr, t.slice(6, t.length)) : e.setAttributeNS(cr, t, n) : n == null || i && !$r(n) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Ue(n) ? String(n) : n
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
function Ul(e, t, n, s) {
  e.removeEventListener(t, n, s);
}
const hr = /* @__PURE__ */ Symbol("_vei");
function Nl(e, t, n, s, r = null) {
  const i = e[hr] || (e[hr] = {}), l = i[t];
  if (s && l)
    l.value = s;
  else {
    const [a, o] = Bl(t);
    if (s) {
      const u = i[t] = Hl(
        s,
        r
      );
      pt(e, a, u, o);
    } else l && (Ul(e, a, l, o), i[t] = void 0);
  }
}
const Dl = /(Once|Passive|Capture)$/, Yl = /^on:?(?:Once|Passive|Capture)$/;
function Bl(e) {
  let t, n;
  for (; (n = e.match(Dl)) && !Yl.test(e); )
    t || (t = {}), e = e.slice(0, e.length - n[1].length), t[n[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : ke(e.slice(2)), t];
}
let ts = 0;
const Vl = /* @__PURE__ */ Promise.resolve(), Fl = () => ts || (Vl.then(() => ts = 0), ts = Date.now());
function Hl(e, t) {
  const n = (s) => {
    if (!s._vts)
      s._vts = Date.now();
    else if (s._vts <= n.attached)
      return;
    const r = n.value;
    if (B(r)) {
      const i = s.stopImmediatePropagation;
      s.stopImmediatePropagation = () => {
        i.call(s), s._stopped = !0;
      };
      const l = r.slice(), a = [s];
      for (let o = 0; o < l.length && !s._stopped; o++) {
        const u = l[o];
        u && De(
          u,
          t,
          5,
          a
        );
      }
    } else
      De(
        r,
        t,
        5,
        [s]
      );
  };
  return n.value = e, n.attached = Fl(), n;
}
const pr = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, jl = (e, t, n, s, r, i) => {
  const l = r === "svg";
  t === "class" ? $l(e, s, l) : t === "style" ? Pl(e, n, s) : On(t) ? kn(t) || Nl(e, t, n, s, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : Kl(e, t, s, l)) ? (dr(e, t, s), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && fr(e, t, s, l, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (ql(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !ie(s))) ? dr(e, Ae(t), s, i, t) : (t === "true-value" ? e._trueValue = s : t === "false-value" && (e._falseValue = s), fr(e, t, s, l));
};
function Kl(e, t, n, s) {
  if (s)
    return !!(t === "innerHTML" || t === "textContent" || t in e && pr(t) && j(n));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return pr(t) && ie(n) ? !1 : t in e;
}
function ql(e, t) {
  const n = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!n)
    return !1;
  const s = Ae(t);
  return Array.isArray(n) ? n.some((r) => Ae(r) === s) : Object.keys(n).some((r) => Ae(r) === s);
}
const gr = {};
// @__NO_SIDE_EFFECTS__
function Wl(e, t, n) {
  let s = /* @__PURE__ */ Te(e, t);
  Pn(s) && (s = oe({}, s, t));
  class r extends ks {
    constructor(l) {
      super(s, l, n);
    }
  }
  return r.def = s, r;
}
const Gl = typeof HTMLElement < "u" ? HTMLElement : class {
};
class ks extends Gl {
  constructor(t, n = {}, s = wr) {
    super(), this._def = t, this._props = n, this._createApp = s, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && s !== wr ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
      oe({}, t.shadowRootOptions, {
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
      if (t instanceof ks) {
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
    this._connected = !1, fn(() => {
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
      if (i && !B(i))
        for (const o in i) {
          const u = i[o];
          (u === Number || u && u.type === Number) && (o in this._props && (this._props[o] = Vs(this._props[o])), (a || (a = /* @__PURE__ */ Object.create(null)))[Ae(o)] = !0);
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
        z(this, s) || Object.defineProperty(this, s, {
          // unwrap ref to be consistent with public instance behavior
          get: () => qr(n[s])
        });
  }
  _resolveProps(t) {
    const { props: n } = t, s = B(n) ? n : Object.keys(n || {});
    for (const r of Object.keys(this))
      r[0] !== "_" && s.includes(r) && this._setProp(r, this[r]);
    for (const r of s.map(Ae))
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
    const r = Ae(t);
    n && this._numberProps && this._numberProps[r] && (s = Vs(s)), this._setProp(r, s, !1, !0);
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
      i && (this._processMutations(i.takeRecords()), i.disconnect()), n === !0 ? this.setAttribute(ke(t), "") : typeof n == "string" || typeof n == "number" ? this.setAttribute(ke(t), n + "") : n || this.removeAttribute(ke(t)), i && i.observe(this, { attributes: !0 });
    }
  }
  _update() {
    const t = this._createVNode();
    this._app && (t.appContext = this._app._context), Zl(t, this._root);
  }
  _createVNode() {
    const t = {};
    this.shadowRoot || (t.onVnodeMounted = t.onVnodeUpdated = this._renderSlots.bind(this));
    const n = ue(this._def, oe(t, this._props));
    return this._instance || (n.ce = (s) => {
      this._instance = s, s.ce = this, s.isCE = !0;
      const r = (i, l) => {
        this.dispatchEvent(
          new CustomEvent(
            i,
            Pn(l[0]) ? oe({ detail: l }, l[0]) : { detail: l }
          )
        );
      };
      s.emit = (i, ...l) => {
        r(i, l), ke(i) !== i && r(ke(i), l);
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
const Dt = (e) => {
  const t = e.props["onUpdate:modelValue"] || !1;
  return B(t) ? (n) => vn(t, n) : t;
};
function zl(e) {
  e.target.composing = !0;
}
function br(e) {
  const t = e.target;
  t.composing && (t.composing = !1, t.dispatchEvent(new Event("input")));
}
const it = /* @__PURE__ */ Symbol("_assign");
function vr(e, t, n) {
  return t && (e = e.trim()), n && (e = Ln(e)), e;
}
const Jl = {
  created(e, { modifiers: { lazy: t, trim: n, number: s } }, r) {
    e[it] = Dt(r);
    const i = s || r.props && r.props.type === "number";
    pt(e, t ? "change" : "input", (l) => {
      l.target.composing || e[it](vr(e.value, n, i));
    }), (n || i) && pt(e, "change", () => {
      e.value = vr(e.value, n, i);
    }), t || (pt(e, "compositionstart", zl), pt(e, "compositionend", br), pt(e, "change", br));
  },
  // set value on mounted so it's after min/max for type="range"
  mounted(e, { value: t }) {
    e.value = t ?? "";
  },
  beforeUpdate(e, { value: t, oldValue: n, modifiers: { lazy: s, trim: r, number: i } }, l) {
    if (e[it] = Dt(l), e.composing) return;
    const a = (i || e.type === "number") && !/^0\d/.test(e.value) ? Ln(e.value) : e.value, o = t ?? "";
    if (a === o)
      return;
    const u = e.getRootNode();
    (u instanceof Document || u instanceof ShadowRoot) && u.activeElement === e && e.type !== "range" && (s && t === n || r && e.value.trim() === o) || (e.value = o);
  }
}, $n = {
  // #4096 array checkboxes need to be deep traversed
  deep: !0,
  created(e, t, n) {
    e[it] = Dt(n), pt(e, "change", () => {
      const s = e._modelValue, r = an(e), i = e.checked, l = e[it];
      if (B(s)) {
        const a = vs(s, r), o = a !== -1;
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
    e[it] = Dt(n), yr(e, t, n);
  }
};
function yr(e, { value: t, oldValue: n }, s) {
  e._modelValue = t;
  let r;
  if (B(t))
    r = vs(t, s.props.value) > -1;
  else if (Yt(t))
    r = t.has(s.props.value);
  else {
    if (t === n) return;
    r = Bt(t, Oi(e, !0));
  }
  e.checked !== r && (e.checked = r);
}
const Ql = {
  // <select multiple> value need to be deep traversed
  deep: !0,
  created(e, { value: t, modifiers: { number: n } }, s) {
    e._modelValue = t, pt(e, "change", () => {
      const r = Array.prototype.filter.call(e.options, (i) => i.selected).map(
        (i) => n ? Ln(an(i)) : an(i)
      );
      e[it](
        e.multiple ? Yt(e._modelValue) ? new Set(r) : r : r[0]
      ), e._assigning = !0, fn(() => {
        e._assigning = !1;
      });
    }), e[it] = Dt(s);
  },
  // set value in mounted & updated because <select> relies on its children
  // <option>s.
  mounted(e, { value: t }) {
    mr(e, t);
  },
  beforeUpdate(e, { value: t }, n) {
    e._modelValue = t, e[it] = Dt(n);
  },
  updated(e, { value: t }) {
    e._assigning || mr(e, t);
  }
};
function mr(e, t) {
  const n = e.multiple, s = B(t);
  if (!(n && !s && !Yt(t))) {
    for (let r = 0, i = e.options.length; r < i; r++) {
      const l = e.options[r], a = an(l);
      if (n)
        if (s) {
          const o = typeof a;
          o === "string" || o === "number" ? l.selected = t.some((u) => String(u) === String(a)) : l.selected = vs(t, a) > -1;
        } else
          l.selected = t.has(a);
      else if (Bt(an(l), t)) {
        e.selectedIndex !== r && (e.selectedIndex = r);
        return;
      }
    }
    !n && e.selectedIndex !== -1 && (e.selectedIndex = -1);
  }
}
function an(e) {
  return "_value" in e ? e._value : e.value;
}
function Oi(e, t) {
  const n = t ? "_trueValue" : "_falseValue";
  return n in e ? e[n] : t;
}
const Xl = /* @__PURE__ */ oe({ patchProp: jl }, xl);
let _r;
function ki() {
  return _r || (_r = al(Xl));
}
const Zl = ((...e) => {
  ki().render(...e);
}), wr = ((...e) => {
  const t = ki().createApp(...e), { mount: n } = t;
  return t.mount = (s) => {
    const r = ta(s);
    if (!r) return;
    const i = t._component;
    !j(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
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
  return ie(e) ? document.querySelector(e) : e;
}
const na = 8e3, sa = 2e3, Cr = 1e6, Se = "Unable to complete this request.", Sr = "Request timed out.", en = "Request cancelled.", Pi = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Mi = `
  plugin { enabled dashboardWidgetEnable bindMode customHost port authMode tailscaleServe tailscaleHostname logLevel updateChannel }
  services { service enabled baseUrl username hasPassword hasApiKey extra { key value } }
`, Ps = `
  config { ${Mi} }
  changed restarted rolledBack error
`, ra = `query YarrRuntime { yarrRuntime { ${Pi} } }`, ia = `query YarrConfig { yarrConfig { ${Mi} } }`, oa = `mutation SaveYarrConfig($input: SaveYarrConfigInput!) {
  saveYarrConfig(input: $input) { ${Ps} }
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
}`, jn = `
  operation outcome installedVersion packagedVersion availableVersion updateAvailable usingOverlay rollbackAvailable rolledBack cleanupPending recoveryIdentifier message
`, ca = `query YarrUpdateStatus { yarrUpdateStatus { ${jn} } }`, fa = `mutation PreviewYarrImport($input: PreviewYarrImportInput!) {
  previewYarrImport(input: $input) {
    previewId mappings { serviceId baseUrl hasUsername hasPassword hasApiKey urlRequired } warnings
  }
}`, da = `mutation ApplyYarrImport($input: ApplyYarrImportInput!) {
  applyYarrImport(input: $input) { ${Ps} }
}`, ha = `mutation ApplyYarrDiscovery($input: ApplyYarrDiscoveryInput!) {
  applyYarrDiscovery(input: $input) { ${Ps} }
}`, pa = `mutation UpdateYarrBinary($version: String!) {
  updateYarrBinary(version: $version) { ${jn} }
}`, ga = `mutation ResetYarrBinary {
  resetYarrBinary { ${jn} }
}`, ba = `mutation RollbackYarrBinary {
  rollbackYarrBinary { ${jn} }
}`;
function Ms(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function tn(e) {
  return new DOMException(e, "AbortError");
}
async function va(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw tn(en);
    return;
  }
  await new Promise((t, n) => {
    const s = window.setInterval(() => {
      window.csrf_token && l(t);
    }, 20), r = window.setTimeout(() => l(t), sa), i = () => l(() => n(tn(en))), l = (a) => {
      window.clearInterval(s), window.clearTimeout(r), e.removeEventListener("abort", i), a();
    };
    e.addEventListener("abort", i, { once: !0 });
  });
}
async function ya(e) {
  const t = e.body;
  if (!t) throw new Error(Se);
  const n = e.headers.get("content-length");
  if (n && /^(?:0|[1-9]\d*)$/.test(n)) {
    const o = Number(n);
    if (Number.isSafeInteger(o) && o > Cr) {
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
      if (i += u.byteLength, i > Cr) {
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
async function ma(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function $e(e, t, n) {
  const s = new AbortController();
  let r = !1, i = !1;
  const l = window.setTimeout(() => {
    r = !0, s.abort(tn(Sr));
  }, na), a = () => s.abort(tn(en));
  n != null && n.aborted ? a() : n == null || n.addEventListener("abort", a, { once: !0 });
  try {
    if (await va(s.signal), s.signal.aborted) throw tn(en);
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
      throw i = !0, await ma(o.body), s.abort(), new Error(Se);
    const u = await ya(o);
    if (Array.isArray(u.errors) && u.errors.length > 0) throw new Error(Se);
    if (!Ms(u.data)) throw new Error(Se);
    return u.data;
  } catch (o) {
    throw r ? new Error(Sr) : i ? new Error(Se) : s.signal.aborted ? new Error(en) : o instanceof Error && o.message === Se ? o : new Error(Se);
  } finally {
    window.clearTimeout(l), n == null || n.removeEventListener("abort", a);
  }
}
function Ie(e, t) {
  const n = e[t];
  if (!Ms(n)) throw new Error(Se);
  return n;
}
async function _a(e) {
  return Ie(await $e(ra, void 0, e), "yarrRuntime");
}
async function wa(e) {
  return Ie(await $e(ia, void 0, e), "yarrConfig");
}
async function Ca(e, t) {
  return Ie(
    await $e(oa, { input: e }, t),
    "saveYarrConfig"
  );
}
async function Sa(e, t) {
  return Ie(
    await $e(la, { action: e }, t),
    "controlYarr"
  );
}
async function Aa(e) {
  return Ie(
    await $e(aa, void 0, e),
    "yarrDiscoveredServices"
  );
}
async function Ea(e, t) {
  const n = Math.max(1, Math.min(500, Math.trunc(e)));
  return Ie(
    await $e(ua, { lines: n }, t),
    "yarrLogs"
  );
}
async function Ra(e) {
  return Ie(
    await $e(ca, void 0, e),
    "yarrUpdateStatus"
  );
}
async function xa(e, t) {
  return Ie(
    await $e(fa, { input: { text: e } }, t),
    "previewYarrImport"
  );
}
async function Ta(e, t) {
  return Ie(
    await $e(da, { input: e }, t),
    "applyYarrImport"
  );
}
async function $a(e, t) {
  return Ie(
    await $e(ha, { input: e }, t),
    "applyYarrDiscovery"
  );
}
async function Ia(e, t) {
  return Ie(
    await $e(pa, { version: e }, t),
    "updateYarrBinary"
  );
}
async function Oa(e) {
  return Ie(
    await $e(ga, void 0, e),
    "resetYarrBinary"
  );
}
async function ka(e) {
  return Ie(
    await $e(ba, void 0, e),
    "rollbackYarrBinary"
  );
}
const Pa = {
  key: 0,
  class: "yarr-dialog-backdrop"
}, Ma = ["aria-busy"], La = { class: "yarr-dialog__header" }, Ua = ["disabled"], Na = { class: "yarr-dialog__body" }, Da = {
  key: 0,
  class: "yarr-dialog__footer"
}, Ya = "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", Ls = /* @__PURE__ */ Te({
  __name: "AccessibleDialog",
  props: {
    open: { type: Boolean },
    title: {},
    busy: { type: Boolean, default: !1 }
  },
  emits: ["close"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(), i = `yarr-dialog-${ti()}`;
    let l = null;
    function a(b) {
      if (b.hasAttribute("disabled") || b.getAttribute("aria-disabled") === "true" || b.hidden || b.closest("[hidden]")) return !1;
      const I = window.getComputedStyle(b);
      return I.display !== "none" && I.visibility !== "hidden";
    }
    function o() {
      var b;
      return [...((b = r.value) == null ? void 0 : b.querySelectorAll(Ya)) ?? []].filter(a);
    }
    function u() {
      var I;
      const b = (I = r.value) == null ? void 0 : I.querySelector("[data-autofocus]");
      return b && a(b) ? b : o()[0] ?? r.value;
    }
    function c(b) {
      var q, K;
      if (b.key === "Escape" && !n.busy) {
        b.preventDefault(), s("close");
        return;
      }
      if (b.key !== "Tab" || !n.open) return;
      const I = o();
      if (I.length === 0) {
        b.preventDefault(), (q = r.value) == null || q.focus();
        return;
      }
      const P = document.activeElement instanceof HTMLElement ? I.indexOf(document.activeElement) : -1;
      b.shiftKey && P <= 0 ? (b.preventDefault(), (K = I.at(-1)) == null || K.focus()) : !b.shiftKey && (P === -1 || P === I.length - 1) && (b.preventDefault(), I[0].focus());
    }
    function p(b) {
      var I;
      !n.open || !r.value || r.value.contains(b.target) || (I = u()) == null || I.focus();
    }
    function y() {
      document.removeEventListener("keydown", c), document.removeEventListener("focusin", p);
    }
    return Je(() => n.open, async (b) => {
      var I;
      if (y(), !b) {
        l == null || l.focus(), l = null;
        return;
      }
      l = document.activeElement instanceof HTMLElement ? document.activeElement : null, document.addEventListener("keydown", c), document.addEventListener("focusin", p), await fn(), (I = u()) == null || I.focus();
    }, { immediate: !0 }), Rt(() => {
      y(), l == null || l.focus();
    }), (b, I) => e.open ? (S(), T("div", Pa, [
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
        d("header", La, [
          d("h2", { id: i }, M(e.title), 1),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            "aria-label": "Close dialog",
            onClick: I[0] || (I[0] = (P) => s("close"))
          }, "Close", 8, Ua)
        ]),
        d("div", Na, [
          Gs(b.$slots, "default")
        ]),
        b.$slots.footer ? (S(), T("footer", Da, [
          Gs(b.$slots, "footer")
        ])) : G("", !0)
      ], 8, Ma)
    ])) : G("", !0);
  }
}), Ba = {
  key: 0,
  role: "status"
}, Va = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, Fa = ["disabled"], Ha = {
  key: 0,
  class: "yarr-warning-list"
}, ja = {
  key: 1,
  class: "yarr-empty"
}, Ka = ["name", "value", "disabled"], qa = ["onUpdate:modelValue", "disabled"], Wa = ["disabled"], Ga = ["disabled"], za = /* @__PURE__ */ Te({
  __name: "DiscoveryDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(), i = /* @__PURE__ */ H([]), l = /* @__PURE__ */ H({}), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H("");
    let u, c = 0;
    const p = Ge(() => i.value.length > 0 && !a.value);
    function y(x) {
      return x === "sabnzbd" ? "SABnzbd" : x === "qbittorrent" ? "qBittorrent" : x.charAt(0).toUpperCase() + x.slice(1);
    }
    function b() {
      c += 1, u == null || u.abort(), r.value = void 0, i.value = [], l.value = {}, a.value = !1, o.value = "";
    }
    function I() {
      b(), s("close");
    }
    async function P() {
      u == null || u.abort(), u = new AbortController();
      const x = ++c;
      a.value = !0, o.value = "";
      try {
        const k = await Aa(u.signal);
        x === c && (r.value = k);
      } catch {
        x === c && !u.signal.aborted && (o.value = "Docker discovery failed. Confirm the read-only Docker socket is available, then retry.");
      } finally {
        x === c && (a.value = !1);
      }
    }
    async function q() {
      if (!r.value || i.value.length === 0) return;
      u == null || u.abort(), u = new AbortController(), a.value = !0, o.value = "";
      const x = r.value.candidates.filter((v) => i.value.includes(v.candidateId)), k = [...new Set(x.map((v) => v.serviceId))];
      try {
        const v = await $a({
          discoveryId: r.value.discoveryId,
          selectedCandidateIds: [...i.value],
          credentialConsent: k.map((U) => ({ serviceId: U, consent: l.value[U] === !0 }))
        }, u.signal);
        b(), s("applied", v), s("close");
      } catch {
        u.signal.aborted || (o.value = "Discovery apply result was not confirmed. Refresh current configuration before retrying."), a.value = !1;
      }
    }
    function K(x) {
      var k;
      return ((k = r.value) == null ? void 0 : k.candidates.some((v) => v.serviceId === x && i.value.includes(v.candidateId))) === !0;
    }
    return Je(() => n.open, (x) => {
      x ? (b(), P()) : b();
    }), Je(a, (x) => s("busy", x)), Rt(b), (x, k) => (S(), Re(Ls, {
      open: e.open,
      title: "Discover Docker services",
      busy: a.value,
      onClose: I
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: a.value,
          onClick: I
        }, "Cancel", 8, Wa),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: q
        }, M(a.value ? "Applying..." : "Apply selected"), 9, Ga)
      ]),
      default: At(() => [
        k[2] || (k[2] = d("p", null, "Yarr reads bounded container identity and endpoint metadata. Select each candidate explicitly.", -1)),
        a.value && !r.value ? (S(), T("p", Ba, "Inspecting Docker services...")) : G("", !0),
        o.value ? (S(), T("div", Va, [
          d("p", null, M(o.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: a.value,
            onClick: P
          }, "Retry discovery", 8, Fa)
        ])) : G("", !0),
        r.value ? (S(), T(ne, { key: 2 }, [
          r.value.errors.length ? (S(), T("ul", Ha, [
            (S(!0), T(ne, null, st(r.value.errors, (v) => (S(), T("li", {
              key: v.code
            }, [
              d("strong", null, M(v.code), 1),
              ce(": " + M(v.message), 1)
            ]))), 128))
          ])) : G("", !0),
          r.value.candidates.length === 0 ? (S(), T("p", ja, "No supported Docker services were found.")) : G("", !0),
          (S(!0), T(ne, null, st(r.value.candidates, (v) => (S(), T("fieldset", {
            key: v.candidateId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              St(d("input", {
                "onUpdate:modelValue": k[0] || (k[0] = (U) => i.value = U),
                type: "checkbox",
                name: `discovery-candidate-${v.candidateId}`,
                value: v.candidateId,
                disabled: a.value
              }, null, 8, Ka), [
                [$n, i.value]
              ]),
              k[1] || (k[1] = ce()),
              d("strong", null, M(y(v.serviceId)), 1)
            ]),
            d("span", null, M(v.baseUrl) + " · " + M(v.confidence) + "% confidence", 1),
            d("small", null, M(v.reasons.join("; ")), 1)
          ]))), 128)),
          (S(!0), T(ne, null, st([...new Set(r.value.candidates.filter((v) => v.hasCredential).map((v) => v.serviceId))], (v) => St((S(), T("label", {
            key: v,
            class: "yarr-consent-row"
          }, [
            St(d("input", {
              "onUpdate:modelValue": (U) => l.value[v] = U,
              type: "checkbox",
              disabled: a.value
            }, null, 8, qa), [
              [$n, l.value[v]]
            ]),
            ce(" Import credentials for " + M(y(v)), 1)
          ])), [
            [Il, K(v)]
          ])), 128))
        ], 64)) : G("", !0)
      ]),
      _: 1
    }, 8, ["open", "busy"]));
  }
}), Ja = {
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
}, tu = ["name", "value", "disabled"], nu = { key: 0 }, su = {
  key: 1,
  class: "yarr-error"
}, ru = { key: 2 }, iu = { key: 3 }, ou = ["onUpdate:modelValue", "disabled"], lu = {
  key: 1,
  class: "yarr-error",
  role: "alert"
}, au = ["disabled"], uu = ["disabled"], cu = ["disabled"], fu = /* @__PURE__ */ Te({
  __name: "ImportDialog",
  props: {
    open: { type: Boolean }
  },
  emits: ["close", "applied", "busy"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(""), i = /* @__PURE__ */ H(), l = /* @__PURE__ */ H([]), a = /* @__PURE__ */ H({}), o = /* @__PURE__ */ H(!1), u = /* @__PURE__ */ H("");
    let c;
    const p = Ge(
      () => l.value.length > 0 && !o.value && l.value.every(
        (x) => {
          var k;
          return ((k = i.value) == null ? void 0 : k.mappings.some((v) => v.serviceId === x && !v.urlRequired)) === !0;
        }
      )
    );
    function y() {
      c == null || c.abort(), r.value = "", i.value = void 0, l.value = [], a.value = {}, o.value = !1, u.value = "";
    }
    function b() {
      y(), s("close");
    }
    function I(x) {
      return x === "sabnzbd" ? "SABnzbd" : x === "qbittorrent" ? "qBittorrent" : x.charAt(0).toUpperCase() + x.slice(1);
    }
    function P(x) {
      return x.hasUsername || x.hasPassword || x.hasApiKey;
    }
    async function q() {
      if (r.value.trim() === "") {
        u.value = "Paste .env assignments or Yarr TOML before requesting a preview.";
        return;
      }
      c == null || c.abort(), c = new AbortController(), o.value = !0, u.value = "";
      const x = r.value;
      try {
        i.value = await xa(x, c.signal), r.value = "", l.value = [], a.value = {};
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
            credentialConsent: l.value.map((k) => ({ serviceId: k, consent: a.value[k] === !0 }))
          }, c.signal);
          y(), s("applied", x), s("close");
        } catch {
          c.signal.aborted || (u.value = "Import result was not confirmed. Refresh current configuration before retrying."), o.value = !1;
        }
      }
    }
    return Je(() => n.open, (x) => {
      x ? y() : r.value = "";
    }), Je(o, (x) => s("busy", x)), Rt(y), (x, k) => (S(), Re(Ls, {
      open: e.open,
      title: "Import configuration",
      busy: o.value,
      onClose: b
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: o.value,
          onClick: b
        }, "Cancel", 8, au),
        i.value ? (S(), T("button", {
          key: 1,
          type: "button",
          class: "yarr-button",
          disabled: !p.value,
          onClick: K
        }, M(o.value ? "Applying..." : "Apply selected"), 9, cu)) : (S(), T("button", {
          key: 0,
          type: "button",
          class: "yarr-button",
          disabled: o.value || r.value.trim() === "",
          onClick: q
        }, M(o.value ? "Previewing..." : "Preview import"), 9, uu))
      ]),
      default: At(() => [
        i.value ? (S(), T("div", Za, [
          k[5] || (k[5] = d("p", null, "Select at least one service. Credential permission is separate for each selected service.", -1)),
          i.value.warnings.length ? (S(), T("ul", eu, [
            (S(!0), T(ne, null, st(i.value.warnings, (v) => (S(), T("li", { key: v }, M(v), 1))), 128))
          ])) : G("", !0),
          (S(!0), T(ne, null, st(i.value.mappings, (v) => (S(), T("fieldset", {
            key: v.serviceId,
            class: "yarr-choice-row"
          }, [
            d("label", null, [
              St(d("input", {
                "onUpdate:modelValue": k[1] || (k[1] = (U) => l.value = U),
                type: "checkbox",
                name: `import-service-${v.serviceId}`,
                value: v.serviceId,
                disabled: o.value || v.urlRequired
              }, null, 8, tu), [
                [$n, l.value]
              ]),
              k[4] || (k[4] = ce()),
              d("strong", null, M(I(v.serviceId)), 1)
            ]),
            v.baseUrl ? (S(), T("span", nu, M(v.baseUrl), 1)) : v.urlRequired ? (S(), T("span", su, "URL required before this service can be imported.")) : (S(), T("span", ru, "Uses the existing configured URL.")),
            l.value.includes(v.serviceId) && P(v) ? (S(), T("label", iu, [
              St(d("input", {
                "onUpdate:modelValue": (U) => a.value[v.serviceId] = U,
                type: "checkbox",
                disabled: o.value
              }, null, 8, ou), [
                [$n, a.value[v.serviceId]]
              ]),
              ce(" Import credentials for " + M(I(v.serviceId)), 1)
            ])) : G("", !0)
          ]))), 128)),
          u.value ? (S(), T("p", lu, M(u.value), 1)) : G("", !0)
        ])) : (S(), T("div", Ja, [
          k[3] || (k[3] = d("p", null, "Paste .env assignments or Yarr TOML. Yarr returns only mapped service metadata and warnings, never values.", -1)),
          d("label", null, [
            k[2] || (k[2] = ce("Paste .env or Yarr TOML", -1)),
            St(d("textarea", {
              "onUpdate:modelValue": k[0] || (k[0] = (v) => r.value = v),
              rows: "9",
              disabled: o.value,
              autocomplete: "off",
              spellcheck: "false"
            }, null, 8, Qa), [
              [Jl, r.value]
            ])
          ]),
          u.value ? (S(), T("p", Xa, M(u.value), 1)) : G("", !0)
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
}, Cu = /* @__PURE__ */ Te({
  __name: "LogsPanel",
  setup(e) {
    const t = /* @__PURE__ */ H(200), n = /* @__PURE__ */ H(), s = /* @__PURE__ */ H(!1), r = /* @__PURE__ */ H("");
    let i, l = 0;
    async function a() {
      i == null || i.abort(), i = new AbortController();
      const o = ++l;
      s.value = !0, r.value = "";
      try {
        const u = await Ea(Math.max(1, Math.min(500, t.value)), i.signal);
        o === l && (n.value = u);
      } catch {
        o === l && !i.signal.aborted && (r.value = "Logs could not be loaded. Confirm Yarr is installed and retry.");
      } finally {
        o === l && (s.value = !1);
      }
    }
    return Bn(a), Rt(() => {
      l += 1, i == null || i.abort();
    }), (o, u) => (S(), T("section", {
      class: "yarr-panel",
      "aria-labelledby": "logs-heading",
      "aria-busy": s.value
    }, [
      d("div", hu, [
        u[3] || (u[3] = d("div", null, [
          d("h2", { id: "logs-heading" }, "Logs"),
          d("p", null, "Read a bounded tail of the redacted Yarr log.")
        ], -1)),
        d("div", pu, [
          d("label", null, [
            u[2] || (u[2] = ce("Lines", -1)),
            St(d("select", {
              "onUpdate:modelValue": u[0] || (u[0] = (c) => t.value = c),
              disabled: s.value
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
            disabled: s.value,
            onClick: a
          }, "Refresh logs", 8, bu)
        ])
      ]),
      r.value ? (S(), T("div", vu, [
        d("p", null, M(r.value), 1),
        d("button", {
          type: "button",
          class: "yarr-button",
          disabled: s.value,
          onClick: a
        }, "Retry log request", 8, yu)
      ])) : n.value ? (S(), T(ne, { key: 2 }, [
        n.value.truncated ? (S(), T("p", _u, "Older lines were omitted. Increase the bounded line count if needed.")) : G("", !0),
        d("pre", wu, [
          (S(!0), T(ne, null, st(n.value.lines, (c, p) => (S(), T("span", { key: p }, M(c) + M(`
`), 1))), 128))
        ])
      ], 64)) : (S(), T("p", mu, "Loading logs..."))
    ], 8, du));
  }
}), Su = {
  class: "yarr-panel",
  "aria-labelledby": "overview-heading"
}, Au = { class: "yarr-section-heading" }, Eu = { class: "yarr-actions" }, Ru = ["disabled"], xu = ["disabled"], Tu = ["disabled"], $u = { class: "yarr-detail-list" }, Iu = { class: "yarr-operation-row" }, Ou = { class: "yarr-actions" }, ku = ["disabled"], Pu = ["disabled"], Mu = /* @__PURE__ */ Te({
  __name: "OverviewPanel",
  props: {
    runtime: {},
    config: {},
    busy: { type: Boolean }
  },
  emits: ["control", "import", "discover"],
  setup(e, { emit: t }) {
    const n = t;
    return (s, r) => (S(), T("section", Su, [
      d("div", Au, [
        d("div", null, [
          r[5] || (r[5] = d("h2", { id: "overview-heading" }, "Current operation", -1)),
          d("p", null, M(e.runtime.healthMessage), 1)
        ]),
        d("div", Eu, [
          e.runtime.state !== "running" ? (S(), T("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[0] || (r[0] = (i) => n("control", "START"))
          }, "Start Yarr", 8, Ru)) : (S(), T("button", {
            key: 1,
            type: "button",
            class: "yarr-button",
            disabled: e.busy,
            onClick: r[1] || (r[1] = (i) => n("control", "RESTART"))
          }, "Restart Yarr", 8, xu)),
          e.runtime.state === "running" ? (S(), T("button", {
            key: 2,
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[2] || (r[2] = (i) => n("control", "STOP"))
          }, "Stop Yarr", 8, Tu)) : G("", !0)
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
            onClick: r[3] || (r[3] = (i) => n("import"))
          }, "Import configuration", 8, ku),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: e.busy,
            onClick: r[4] || (r[4] = (i) => n("discover"))
          }, "Discover Docker services", 8, Pu)
        ])
      ])
    ]));
  }
}), Lu = ["disabled"], Uu = ["disabled"], _n = /* @__PURE__ */ Te({
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
    return (s, r) => (S(), Re(Ls, {
      open: e.open,
      title: e.title,
      busy: e.busy,
      onClose: r[2] || (r[2] = (i) => n("close"))
    }, {
      footer: At(() => [
        d("button", {
          type: "button",
          class: "yarr-button is-quiet",
          "data-autofocus": "",
          disabled: e.busy,
          onClick: r[0] || (r[0] = (i) => n("close"))
        }, M(e.cancelLabel), 9, Lu),
        d("button", {
          type: "button",
          class: Et(["yarr-button", { "is-danger": e.danger }]),
          disabled: e.busy,
          onClick: r[1] || (r[1] = (i) => n("confirm"))
        }, M(e.busy ? "Working..." : e.confirmLabel), 11, Uu)
      ]),
      default: At(() => [
        d("p", null, M(e.description), 1)
      ]),
      _: 1
    }, 8, ["open", "title", "busy"]));
  }
}), Nu = { class: "yarr-secret-field" }, Du = { class: "yarr-secret-field__status" }, Yu = ["name", "checked", "disabled"], Bu = ["name", "checked", "disabled"], Vu = ["disabled"], Fu = ["name", "aria-label", "disabled", "value"], Hu = {
  key: 3,
  class: "yarr-secret-field__pending",
  role: "status"
}, ju = ["disabled"], In = /* @__PURE__ */ Te({
  __name: "SecretField",
  props: {
    name: {},
    label: {},
    configured: { type: Boolean },
    intent: { default: "PRESERVE" },
    disabled: { type: Boolean, default: !1 },
    generate: { type: Boolean, default: !1 }
  },
  emits: ["update"],
  setup(e, { emit: t }) {
    const n = e, s = t, r = /* @__PURE__ */ H(n.intent), i = /* @__PURE__ */ H(""), l = /* @__PURE__ */ H(!1), a = `yarr-secret-${n.name}-${ti()}`;
    Je(() => n.intent, (y) => {
      r.value = y, y !== "SET" && (i.value = "");
    });
    function o(y) {
      if (r.value = y, y === "SET") {
        s("update", { kind: "SET", value: i.value });
        return;
      }
      i.value = "", s("update", { kind: y });
    }
    function u(y) {
      i.value = y, s("update", { kind: "SET", value: y });
    }
    function c() {
      const y = new Uint8Array(32);
      globalThis.crypto.getRandomValues(y), r.value = "SET", u([...y].map((b) => b.toString(16).padStart(2, "0")).join(""));
    }
    function p() {
      l.value = !1, o("CLEAR");
    }
    return (y, b) => (S(), T(ne, null, [
      d("fieldset", Nu, [
        d("legend", null, M(e.label), 1),
        d("p", Du, M(e.configured ? "Configured" : "Not configured"), 1),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "PRESERVE",
            disabled: e.disabled,
            onChange: b[0] || (b[0] = (I) => o("PRESERVE"))
          }, null, 40, Yu),
          b[5] || (b[5] = ce(" Keep current value", -1))
        ]),
        d("label", null, [
          d("input", {
            name: `${e.name}-intent`,
            type: "radio",
            checked: r.value === "SET",
            disabled: e.disabled,
            onChange: b[1] || (b[1] = (I) => o("SET"))
          }, null, 40, Bu),
          b[6] || (b[6] = ce(" Set a new value", -1))
        ]),
        e.generate ? (S(), T("button", {
          key: 0,
          type: "button",
          class: "yarr-button is-quiet",
          disabled: e.disabled,
          onClick: c
        }, "Generate secure " + M(e.label.toLowerCase()), 9, Vu)) : G("", !0),
        r.value === "SET" ? (S(), T("label", {
          key: 1,
          for: a
        }, "New " + M(e.label), 1)) : G("", !0),
        r.value === "SET" ? (S(), T("input", {
          key: 2,
          id: a,
          name: `${e.name}-new-value`,
          type: "password",
          "aria-label": `New ${e.label}`,
          autocomplete: "new-password",
          disabled: e.disabled,
          placeholder: "Enter a new value",
          value: i.value,
          onInput: b[2] || (b[2] = (I) => u(I.target.value))
        }, null, 40, Fu)) : G("", !0),
        r.value === "CLEAR" ? (S(), T("p", Hu, "This value will be cleared when changes are saved.")) : G("", !0),
        e.configured ? (S(), T("button", {
          key: 4,
          type: "button",
          class: "yarr-button is-danger is-quiet",
          disabled: e.disabled,
          onClick: b[3] || (b[3] = (I) => l.value = !0)
        }, "Clear " + M(e.label), 9, ju)) : G("", !0)
      ]),
      ue(_n, {
        open: l.value,
        title: `Clear ${e.label}?`,
        description: "Yarr may lose access until a replacement credential is saved.",
        "confirm-label": "Clear credential",
        "cancel-label": "Keep credential",
        busy: e.disabled,
        danger: "",
        onClose: b[4] || (b[4] = (I) => l.value = !1),
        onConfirm: p
      }, null, 8, ["open", "title", "busy"])
    ], 64));
  }
}), Ku = {
  class: "yarr-panel",
  "aria-labelledby": "server-heading"
}, qu = { class: "yarr-form-rows" }, Wu = { class: "yarr-setting-row" }, Gu = ["checked", "disabled"], zu = { class: "yarr-setting-row" }, Ju = ["checked", "disabled"], Qu = { class: "yarr-setting-row" }, Xu = ["value", "disabled"], Zu = {
  key: 0,
  class: "yarr-setting-row"
}, ec = ["value", "disabled"], tc = { class: "yarr-setting-row" }, nc = ["value", "disabled"], sc = { class: "yarr-setting-row" }, rc = ["value", "disabled"], ic = ["disabled"], oc = { class: "yarr-auth-section" }, lc = ["value", "disabled"], ac = {
  key: 2,
  class: "yarr-form-grid"
}, uc = ["value", "disabled"], cc = ["value", "disabled"], fc = { class: "yarr-form-rows" }, dc = { class: "yarr-setting-row" }, hc = ["checked", "disabled"], pc = {
  key: 0,
  class: "yarr-setting-row"
}, gc = ["value", "disabled"], bc = { class: "yarr-setting-row" }, vc = ["value", "disabled"], yc = ["value"], mc = /* @__PURE__ */ Te({
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
    return (a, o) => (S(), T("section", Ku, [
      o[30] || (o[30] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "server-heading" }, "Server & Auth"),
          d("p", null, "Keep Yarr on loopback unless authentication is fully configured.")
        ])
      ], -1)),
      d("div", qu, [
        d("label", Wu, [
          o[14] || (o[14] = d("span", null, [
            d("strong", null, "Run Yarr"),
            d("small", null, "Start Yarr with the array lifecycle.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.enabled,
            disabled: e.disabled,
            onChange: o[0] || (o[0] = (u) => r({ enabled: u.target.checked }))
          }, null, 40, Gu)
        ]),
        d("label", zu, [
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
        d("label", Qu, [
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
          ])], 40, Xu)
        ]),
        e.plugin.bindMode === "CUSTOM" ? (S(), T("label", Zu, [
          o[18] || (o[18] = d("span", null, [
            d("strong", null, "Custom bind address"),
            d("small", null, "Use an IP address owned by this server.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.customHost,
            disabled: e.disabled,
            onInput: o[3] || (o[3] = (u) => r({ customHost: u.target.value }))
          }, null, 40, ec)
        ])) : G("", !0),
        d("label", tc, [
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
          }, null, 40, nc)
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
            }, "Trusted gateway (same-host loopback only)", 8, ic)
          ], 40, rc)
        ])
      ]),
      d("div", oc, [
        e.plugin.authMode === "BEARER" ? (S(), Re(In, {
          key: 0,
          name: "bearer-token",
          label: "Bearer token",
          configured: e.bearerConfigured,
          intent: e.auth.bearerToken.kind,
          disabled: e.disabled,
          generate: "",
          onUpdate: o[6] || (o[6] = (u) => l("bearerToken", u))
        }, null, 8, ["configured", "intent", "disabled"])) : e.plugin.authMode === "GOOGLE_OAUTH" ? (S(), T(ne, { key: 1 }, [
          d("label", null, [
            o[23] || (o[23] = ce("Google client ID", -1)),
            d("input", {
              type: "text",
              value: e.auth.googleClientId,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: o[7] || (o[7] = (u) => i({ googleClientId: u.target.value }))
            }, null, 40, lc)
          ]),
          ue(In, {
            name: "google-client-secret",
            label: "Google client secret",
            configured: e.googleSecretConfigured,
            intent: e.auth.googleClientSecret.kind,
            disabled: e.disabled,
            onUpdate: o[8] || (o[8] = (u) => l("googleClientSecret", u))
          }, null, 8, ["configured", "intent", "disabled"])
        ], 64)) : (S(), T("div", ac, [
          o[26] || (o[26] = d("p", null, "Trusted gateway accepts provenance only from a same-host proxy while Yarr is bound to loopback. Direct-client Host and Origin headers are not authentication.", -1)),
          d("label", null, [
            o[24] || (o[24] = ce("Trusted gateway hosts", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayHosts,
              disabled: e.disabled,
              rows: "3",
              onInput: o[9] || (o[9] = (u) => i({ trustedGatewayHosts: u.target.value }))
            }, null, 40, uc)
          ]),
          d("label", null, [
            o[25] || (o[25] = ce("Trusted gateway origins", -1)),
            d("textarea", {
              value: e.auth.trustedGatewayOrigins,
              disabled: e.disabled,
              rows: "3",
              onInput: o[10] || (o[10] = (u) => i({ trustedGatewayOrigins: u.target.value }))
            }, null, 40, cc)
          ])
        ]))
      ]),
      d("div", fc, [
        d("label", dc, [
          o[27] || (o[27] = d("span", null, [
            d("strong", null, "Tailscale Serve"),
            d("small", null, "Publishes the endpoint and therefore requires bearer or Google OAuth.")
          ], -1)),
          d("input", {
            type: "checkbox",
            checked: e.plugin.tailscaleServe,
            disabled: e.disabled,
            onChange: o[11] || (o[11] = (u) => r({ tailscaleServe: u.target.checked }))
          }, null, 40, hc)
        ]),
        e.plugin.tailscaleServe ? (S(), T("label", pc, [
          o[28] || (o[28] = d("span", null, [
            d("strong", null, "Tailscale hostname"),
            d("small", null, "DNS-label service name.")
          ], -1)),
          d("input", {
            type: "text",
            value: e.plugin.tailscaleHostname,
            disabled: e.disabled,
            onInput: o[12] || (o[12] = (u) => r({ tailscaleHostname: u.target.value }))
          }, null, 40, gc)
        ])) : G("", !0),
        d("label", bc, [
          o[29] || (o[29] = d("span", null, [
            d("strong", null, "Log level"),
            d("small", null, "Increase verbosity only while diagnosing an issue.")
          ], -1)),
          d("select", {
            value: e.plugin.logLevel,
            disabled: e.disabled,
            onChange: o[13] || (o[13] = (u) => r({ logLevel: u.target.value }))
          }, [
            (S(), T(ne, null, st(["TRACE", "DEBUG", "INFO", "WARN", "ERROR"], (u) => d("option", {
              key: u,
              value: u
            }, M(u), 9, yc)), 64))
          ], 40, vc)
        ])
      ])
    ]));
  }
}), _c = {
  class: "yarr-panel",
  "aria-labelledby": "services-heading"
}, wc = {
  key: 0,
  class: "yarr-empty"
}, Cc = ["aria-labelledby"], Sc = { class: "yarr-service-row__identity" }, Ac = ["id"], Ec = { class: "yarr-switch" }, Rc = ["checked", "disabled", "onChange"], xc = { class: "yarr-form-grid" }, Tc = ["value", "disabled", "onInput"], $c = { key: 0 }, Ic = ["value", "disabled", "onInput"], Oc = { class: "yarr-secret-grid" }, kc = /* @__PURE__ */ Te({
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
      const c = n.services.map((p, y) => y === o ? { ...p, ...u } : p);
      s("update", c);
    }
    function a(o, u, c) {
      l(o, { [u]: c });
    }
    return (o, u) => (S(), T("section", _c, [
      u[1] || (u[1] = d("div", { class: "yarr-section-heading" }, [
        d("div", null, [
          d("h2", { id: "services-heading" }, "Services"),
          d("p", null, "Enable only the integrations Yarr should contact.")
        ])
      ], -1)),
      e.services.length === 0 ? (S(), T("p", wc, "No service definitions are available.")) : G("", !0),
      (S(!0), T(ne, null, st(e.services, (c, p) => (S(), T("section", {
        key: c.service,
        class: "yarr-service-row",
        "aria-labelledby": `service-${c.service}`
      }, [
        d("div", Sc, [
          d("h3", {
            id: `service-${c.service}`
          }, M(i(c.service)), 9, Ac),
          d("label", Ec, [
            d("input", {
              type: "checkbox",
              checked: c.enabled,
              disabled: e.disabled,
              onChange: (y) => l(p, { enabled: y.target.checked })
            }, null, 40, Rc),
            u[0] || (u[0] = ce(" Enabled", -1))
          ])
        ]),
        d("div", xc, [
          d("label", null, [
            ce(M(i(c.service)) + " base URL", 1),
            d("input", {
              type: "url",
              value: c.baseUrl,
              disabled: e.disabled,
              onInput: (y) => l(p, { baseUrl: y.target.value })
            }, null, 40, Tc)
          ]),
          c.username !== null ? (S(), T("label", $c, [
            ce(M(i(c.service)) + " username", 1),
            d("input", {
              type: "text",
              value: c.username,
              disabled: e.disabled,
              autocomplete: "off",
              onInput: (y) => l(p, { username: y.target.value })
            }, null, 40, Ic)
          ])) : G("", !0)
        ]),
        d("div", Oc, [
          ue(In, {
            name: `${c.service}-password`,
            label: `${i(c.service)} password`,
            configured: c.hasPassword,
            intent: c.password.kind,
            disabled: e.disabled,
            onUpdate: (y) => a(p, "password", y)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"]),
          ue(In, {
            name: `${c.service}-api-key`,
            label: `${i(c.service)} API key`,
            configured: c.hasApiKey,
            intent: c.apiKey.kind,
            disabled: e.disabled,
            onUpdate: (y) => a(p, "apiKey", y)
          }, null, 8, ["name", "label", "configured", "intent", "disabled", "onUpdate"])
        ])
      ], 8, Cc))), 128))
    ]));
  }
}), Pc = ["aria-label"], Mc = {
  class: "yarr-status-badge__symbol",
  "aria-hidden": "true"
}, Lc = /* @__PURE__ */ Te({
  __name: "StatusBadge",
  props: {
    state: {},
    label: { default: void 0 }
  },
  setup(e) {
    const t = e, n = Ge(() => t.label ?? {
      success: "Available",
      warning: "Needs attention",
      danger: "Unavailable",
      neutral: "Unknown"
    }[t.state]);
    return (s, r) => (S(), T("span", {
      class: Et(["yarr-status-badge", `is-${e.state}`]),
      "aria-label": `Status: ${n.value}`
    }, [
      d("span", Mc, M(e.state === "success" ? "OK" : e.state === "danger" ? "!" : "-"), 1),
      d("span", null, M(n.value), 1)
    ], 10, Pc));
  }
}), Uc = ["aria-busy"], Nc = { class: "yarr-section-heading" }, Dc = ["disabled"], Yc = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, Bc = ["disabled"], Vc = {
  key: 1,
  role: "status"
}, Fc = { class: "yarr-detail-list" }, Hc = { key: 0 }, jc = { key: 1 }, Kc = { key: 2 }, qc = { key: 3 }, Wc = { class: "yarr-actions" }, Gc = ["disabled"], zc = ["disabled"], Jc = ["disabled"], Qc = /* @__PURE__ */ Te({
  __name: "UpdatesPanel",
  emits: ["busy"],
  setup(e, { emit: t }) {
    const n = t, s = /* @__PURE__ */ H(), r = /* @__PURE__ */ H(""), i = /* @__PURE__ */ H(!1), l = /* @__PURE__ */ H(!1), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H(!1);
    let u, c = 0;
    const p = /* @__PURE__ */ new Set([
      "APPLY_RESTORATION_INCOMPLETE",
      "RESET_RESTORATION_INCOMPLETE",
      "ROLLBACK_RESTORATION_INCOMPLETE"
    ]), y = /* @__PURE__ */ new Set([
      "APPLY_FAILED_BEFORE_ACTIVATION",
      "RESET_FAILED_BEFORE_MUTATION",
      "ROLLBACK_FAILED_BEFORE_ACTIVATION"
    ]), b = Ge(() => s.value !== void 0 && p.has(s.value.outcome)), I = Ge(() => s.value !== void 0 && y.has(s.value.outcome)), P = Ge(() => {
      var U;
      return ((U = s.value) == null ? void 0 : U.outcome) === "ROLLBACK_RESTORED";
    }), q = Ge(() => s.value !== void 0 && (s.value.rolledBack || s.value.cleanupPending || b.value || s.value.outcome === "ROLLBACK_FAILED_BEFORE_ACTIVATION" || s.value.outcome === "ROLLBACK_UNAVAILABLE"));
    async function K() {
      u == null || u.abort(), u = new AbortController();
      const U = ++c;
      i.value = !0, r.value = "";
      try {
        const F = await Ra(u.signal);
        U === c && (s.value = F);
      } catch {
        U === c && !u.signal.aborted && (r.value = "Update status could not be loaded. Check Yarr connectivity, then retry.");
      } finally {
        U === c && (i.value = !1);
      }
    }
    async function x() {
      if (s.value) {
        u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
        try {
          s.value = await Ia(s.value.availableVersion, u.signal), l.value = !1;
        } catch {
          u.signal.aborted || (r.value = "Update result was not confirmed. Refresh update status before retrying.");
        } finally {
          i.value = !1;
        }
      }
    }
    async function k() {
      u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
      try {
        s.value = await Oa(u.signal), a.value = !1;
      } catch {
        u.signal.aborted || (r.value = "Reset result was not confirmed. Refresh update status before retrying.");
      } finally {
        i.value = !1;
      }
    }
    async function v() {
      u == null || u.abort(), u = new AbortController(), i.value = !0, r.value = "";
      try {
        s.value = await ka(u.signal), o.value = !1;
      } catch {
        u.signal.aborted || (r.value = "Rollback result was not confirmed. Refresh update status before retrying.");
      } finally {
        i.value = !1;
      }
    }
    return Bn(K), Je(i, (U) => n("busy", U)), Rt(() => {
      c += 1, u == null || u.abort(), n("busy", !1);
    }), (U, F) => {
      var ye;
      return S(), T("section", {
        class: "yarr-panel",
        "aria-labelledby": "updates-heading",
        "aria-busy": i.value
      }, [
        d("div", Nc, [
          F[6] || (F[6] = d("div", null, [
            d("h2", { id: "updates-heading" }, "Updates"),
            d("p", null, "Install a verified release or return to the package version.")
          ], -1)),
          d("button", {
            type: "button",
            class: "yarr-button is-quiet",
            disabled: i.value,
            onClick: K
          }, "Check again", 8, Dc)
        ]),
        r.value ? (S(), T("div", Yc, [
          d("p", null, M(r.value), 1),
          s.value ? G("", !0) : (S(), T("button", {
            key: 0,
            type: "button",
            class: "yarr-button",
            disabled: i.value,
            onClick: K
          }, "Retry update check", 8, Bc))
        ])) : G("", !0),
        !s.value && !r.value ? (S(), T("p", Vc, "Checking update status...")) : G("", !0),
        s.value ? (S(), T(ne, { key: 2 }, [
          d("dl", Fc, [
            d("div", null, [
              F[7] || (F[7] = d("dt", null, "Installed", -1)),
              d("dd", null, M(s.value.installedVersion), 1)
            ]),
            d("div", null, [
              F[8] || (F[8] = d("dt", null, "Packaged", -1)),
              d("dd", null, M(s.value.packagedVersion), 1)
            ]),
            d("div", null, [
              F[9] || (F[9] = d("dt", null, "Available", -1)),
              d("dd", null, M(s.value.availableVersion), 1)
            ]),
            d("div", null, [
              F[10] || (F[10] = d("dt", null, "Source", -1)),
              d("dd", null, M(s.value.usingOverlay ? "Update overlay" : "Plugin package"), 1)
            ])
          ]),
          d("p", {
            class: Et(["yarr-result", { "is-warning": q.value }]),
            role: "status"
          }, [
            ce(M(s.value.message) + " ", 1),
            s.value.rolledBack ? (S(), T("strong", Hc, M(P.value ? " The current version was restored." : " The previous version was restored."), 1)) : G("", !0),
            b.value ? (S(), T("strong", jc, " The prior binary and runtime state were not confirmed restored. Inspect the retained recovery snapshots before retrying.")) : G("", !0),
            s.value.cleanupPending && I.value ? (S(), T("strong", Kc, " No live binary mutation was committed.")) : G("", !0),
            s.value.cleanupPending ? (S(), T("strong", qc, [
              F[11] || (F[11] = ce(" Retained recovery snapshots ", -1)),
              d("code", null, M(s.value.recoveryIdentifier), 1),
              F[12] || (F[12] = ce(" under /mnt/user/appdata/yarr/bin require operator cleanup.", -1))
            ])) : G("", !0)
          ], 2),
          d("div", Wc, [
            s.value.updateAvailable ? (S(), T("button", {
              key: 0,
              type: "button",
              class: "yarr-button",
              disabled: i.value,
              onClick: F[0] || (F[0] = (le) => l.value = !0)
            }, "Install " + M(s.value.availableVersion), 9, Gc)) : G("", !0),
            s.value.rollbackAvailable ? (S(), T("button", {
              key: 1,
              type: "button",
              class: "yarr-button is-quiet",
              disabled: i.value,
              onClick: F[1] || (F[1] = (le) => o.value = !0)
            }, "Roll back to previous version", 8, zc)) : G("", !0),
            d("button", {
              type: "button",
              class: "yarr-button is-danger is-quiet",
              disabled: i.value,
              onClick: F[2] || (F[2] = (le) => a.value = !0)
            }, "Reset to packaged version", 8, Jc)
          ])
        ], 64)) : G("", !0),
        ue(_n, {
          open: l.value,
          title: `Install Yarr ${(ye = s.value) == null ? void 0 : ye.availableVersion}?`,
          description: "Yarr will restart. If readiness fails, the updater will attempt to restore the previous binary.",
          "confirm-label": "Install update",
          busy: i.value,
          onClose: F[3] || (F[3] = (le) => l.value = !1),
          onConfirm: x
        }, null, 8, ["open", "title", "busy"]),
        ue(_n, {
          open: o.value,
          title: "Roll back to the previous Yarr binary?",
          description: "Yarr will preserve both binaries in durable snapshots, atomically activate yarr.previous, restart if it is running, and restore from the snapshots if readiness fails.",
          "confirm-label": "Roll back Yarr",
          busy: i.value,
          onClose: F[4] || (F[4] = (le) => o.value = !1),
          onConfirm: v
        }, null, 8, ["open", "busy"]),
        ue(_n, {
          open: a.value,
          title: "Reset to packaged Yarr?",
          description: "This removes the update overlay and restarts the binary shipped by the plugin package.",
          "confirm-label": "Reset Yarr",
          busy: i.value,
          danger: "",
          onClose: F[5] || (F[5] = (le) => a.value = !1),
          onConfirm: k
        }, null, 8, ["open", "busy"])
      ], 8, Uc);
    };
  }
}), Xc = ["aria-busy"], Zc = { class: "yarr-identity" }, ef = { class: "yarr-workspace" }, tf = {
  key: 0,
  class: "yarr-error yarr-load-error",
  role: "alert"
}, nf = ["disabled"], sf = {
  key: 1,
  class: "yarr-shell__message",
  role: "status"
}, rf = { class: "yarr-tabs-wrap" }, of = {
  class: "yarr-tabs",
  role: "tablist",
  "aria-label": "Yarr settings sections"
}, lf = ["id", "aria-selected", "aria-controls", "tabindex", "disabled", "onClick", "onKeydown"], af = ["id", "aria-labelledby"], uf = { class: "yarr-save-bar" }, cf = { "aria-live": "polite" }, ff = {
  key: 0,
  class: "yarr-error",
  role: "alert"
}, df = {
  key: 1,
  class: "yarr-result",
  role: "status"
}, hf = { key: 2 }, pf = ["disabled"], gf = /* @__PURE__ */ Te({
  __name: "YarrSettings.ce",
  setup(e) {
    const t = ["Overview", "Services", "Server & Auth", "Updates", "Logs"], n = /* @__PURE__ */ H(), s = /* @__PURE__ */ H(), r = /* @__PURE__ */ H(), i = /* @__PURE__ */ H(), l = /* @__PURE__ */ H([]), a = /* @__PURE__ */ H(!1), o = /* @__PURE__ */ H(!1), u = /* @__PURE__ */ H("Overview"), c = /* @__PURE__ */ H(!0), p = /* @__PURE__ */ H(!1), y = /* @__PURE__ */ H(!1), b = /* @__PURE__ */ H(""), I = /* @__PURE__ */ H(""), P = /* @__PURE__ */ H(""), q = /* @__PURE__ */ H(!1), K = /* @__PURE__ */ H(!1), x = /* @__PURE__ */ H(!1), k = /* @__PURE__ */ H([]);
    let v, U, F = 0;
    const ye = Ge(() => n.value && s.value && r.value && i.value), le = Ge(() => p.value || y.value);
    function gt(N, R) {
      var L;
      return ((L = N == null ? void 0 : N.extra.find((de) => de.key === R)) == null ? void 0 : L.value) ?? "";
    }
    function Me(N) {
      n.value = N, r.value = { ...N.plugin };
      const R = N.services.find((L) => L.service === "yarr");
      a.value = (R == null ? void 0 : R.hasApiKey) ?? !1, o.value = (R == null ? void 0 : R.hasPassword) ?? !1, i.value = {
        bearerToken: { kind: "PRESERVE" },
        googleClientId: (R == null ? void 0 : R.username) ?? "",
        googleClientSecret: { kind: "PRESERVE" },
        trustedGatewayHosts: gt(R, "YARR_MCP_ALLOWED_HOSTS"),
        trustedGatewayOrigins: gt(R, "YARR_MCP_ALLOWED_ORIGINS")
      }, l.value = N.services.filter((L) => L.service !== "yarr").map((L) => ({
        ...L,
        extra: L.extra.map((de) => ({ ...de })),
        password: { kind: "PRESERVE" },
        apiKey: { kind: "PRESERVE" }
      }));
    }
    async function ft() {
      v == null || v.abort(), v = new AbortController();
      const N = ++F;
      c.value = !0, x.value = !0, b.value = "", I.value = "";
      try {
        const [R, L] = await Promise.all([
          wa(v.signal),
          _a(v.signal)
        ]);
        if (N !== F) return;
        Me(R), s.value = L;
      } catch {
        N === F && !v.signal.aborted && (b.value = "Yarr settings could not be loaded. Confirm the Unraid API is running, then retry.");
      } finally {
        N === F && (c.value = !1, x.value = !1);
      }
    }
    function xt(N, R) {
      return R.kind === "CLEAR" ? !1 : R.kind === "SET" ? R.value.trim().length > 0 : N;
    }
    function Tt(N, R) {
      return R.kind === "CLEAR" ? !1 : R.kind === "PRESERVE" ? N : /^[0-9A-Fa-f]{64}$/.test(R.value) || /^[0-9A-Za-z_-]{43}$/.test(R.value);
    }
    function Vt() {
      return !r.value || !i.value ? "" : r.value.authMode === "TRUSTED_GATEWAY" ? r.value.bindMode !== "LOOPBACK" || r.value.tailscaleServe ? "Trusted gateway is limited to a same-host proxy with loopback binding and Tailscale Serve disabled. Use bearer or Google OAuth for network exposure." : i.value.trustedGatewayHosts.trim() === "" && i.value.trustedGatewayOrigins.trim() === "" ? "Trusted gateway authentication requires at least one allowed host or origin." : "" : r.value.bindMode === "LOOPBACK" && !r.value.tailscaleServe ? "" : r.value.authMode === "BEARER" && !Tt(a.value, i.value.bearerToken) ? "Bearer authentication requires a generated 256-bit token before Yarr can bind beyond loopback." : r.value.authMode === "GOOGLE_OAUTH" && (i.value.googleClientId.trim() === "" || !xt(o.value, i.value.googleClientSecret)) ? "Google OAuth requires a client ID and configured client secret before Yarr can bind beyond loopback." : "";
    }
    function bt(N) {
      return N.kind === "SET" && N.value.trim() === "" ? { kind: "PRESERVE" } : N;
    }
    function fe() {
      const N = r.value, R = i.value;
      return {
        ...N,
        bearerToken: bt(R.bearerToken),
        googleClientId: R.googleClientId,
        googleClientSecret: bt(R.googleClientSecret),
        trustedGatewayHosts: R.trustedGatewayHosts,
        trustedGatewayOrigins: R.trustedGatewayOrigins,
        services: l.value.map((L) => {
          const de = {
            service: L.service,
            enabled: L.enabled,
            password: bt(L.password),
            apiKey: bt(L.apiKey)
          };
          return L.baseUrl.trim() !== "" && (de.baseUrl = L.baseUrl), L.username !== null && (de.username = L.username), de;
        })
      };
    }
    function se(N) {
      return N.rolledBack ? `Changes were not kept. Previous configuration restored.${N.error ? ` ${N.error}` : ""}` : N.error ? `Save outcome is indeterminate. ${N.error} Check runtime status and logs before retrying.` : N.changed ? N.restarted ? "Changes saved and Yarr restarted." : N.config.plugin.enabled ? "Changes saved. Yarr did not require a restart." : "Changes saved and Yarr stopped." : "No configuration changes were needed.";
    }
    async function Q() {
      const N = Vt();
      if (N) {
        I.value = N;
        return;
      }
      U == null || U.abort(), U = new AbortController(), p.value = !0, I.value = "", P.value = "";
      try {
        const R = await Ca(fe(), U.signal);
        Me(R.config), P.value = se(R);
      } catch {
        U.signal.aborted || (I.value = "Save result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    async function Qe(N) {
      U == null || U.abort(), U = new AbortController(), p.value = !0, I.value = "";
      try {
        s.value = await Sa(N, U.signal), P.value = N === "STOP" ? "Yarr stopped." : N === "START" ? "Yarr started." : "Yarr restarted.";
      } catch {
        U.signal.aborted || (I.value = "Control result was not confirmed. Refresh current state before retrying.");
      } finally {
        p.value = !1;
      }
    }
    function vt(N) {
      Me(N.config), P.value = se(N);
    }
    function Ye(N, R = !1) {
      u.value = N, R && fn(() => {
        var L;
        return (L = k.value[t.indexOf(N)]) == null ? void 0 : L.focus();
      });
    }
    function Oe(N, R) {
      let L = R;
      if (N.key === "ArrowRight") L = (R + 1) % t.length;
      else if (N.key === "ArrowLeft") L = (R - 1 + t.length) % t.length;
      else if (N.key === "Home") L = 0;
      else if (N.key === "End") L = t.length - 1;
      else return;
      N.preventDefault(), Ye(t[L], !0);
    }
    function hn(N, R) {
      N && (k.value[R] = N);
    }
    return Bn(ft), Rt(() => {
      F += 1, v == null || v.abort(), U == null || U.abort();
    }), (N, R) => (S(), T("section", {
      class: "yarr-shell yarr-settings",
      "aria-labelledby": "yarr-settings-title",
      "aria-busy": c.value || p.value
    }, [
      d("aside", Zc, [
        R[10] || (R[10] = d("p", { class: "yarr-shell__eyebrow" }, "Unraid service", -1)),
        R[11] || (R[11] = d("h1", { id: "yarr-settings-title" }, "Yarr", -1)),
        s.value ? (S(), Re(Lc, {
          key: 0,
          state: s.value.ready ? "success" : s.value.state === "running" ? "warning" : "neutral",
          label: s.value.ready ? "Ready" : s.value.state
        }, null, 8, ["state", "label"])) : G("", !0),
        R[12] || (R[12] = d("p", null, "Media service operations", -1))
      ]),
      d("main", ef, [
        b.value ? (S(), T("div", tf, [
          d("p", null, M(b.value), 1),
          d("button", {
            type: "button",
            class: "yarr-button",
            disabled: c.value,
            onClick: ft
          }, "Retry", 8, nf)
        ])) : ye.value ? (S(), T(ne, { key: 2 }, [
          d("ol", {
            class: Et(["yarr-signal-rail", { "is-refreshing": x.value }]),
            "aria-label": "Yarr lifecycle signals"
          }, [
            d("li", null, [
              R[13] || (R[13] = d("span", null, "Process", -1)),
              d("strong", null, M(s.value.state), 1)
            ]),
            d("li", null, [
              R[14] || (R[14] = d("span", null, "Ready", -1)),
              d("strong", null, M(s.value.ready ? "Yes" : "No"), 1)
            ]),
            d("li", null, [
              R[15] || (R[15] = d("span", null, "Endpoint", -1)),
              d("strong", null, M(s.value.bindAddress) + ":" + M(s.value.port), 1)
            ]),
            d("li", null, [
              R[16] || (R[16] = d("span", null, "Version", -1)),
              d("strong", null, M(s.value.version ?? "Unavailable"), 1)
            ])
          ], 2),
          d("div", rf, [
            d("div", of, [
              (S(), T(ne, null, st(t, (L, de) => d("button", {
                id: `yarr-tab-${de}`,
                key: L,
                ref_for: !0,
                ref: (dt) => hn(dt, de),
                type: "button",
                role: "tab",
                "aria-selected": u.value === L,
                "aria-controls": `yarr-panel-${de}`,
                tabindex: u.value === L ? 0 : -1,
                disabled: le.value,
                onClick: (dt) => Ye(L),
                onKeydown: (dt) => Oe(dt, de)
              }, M(L), 41, lf)), 64))
            ])
          ]),
          d("div", {
            id: `yarr-panel-${t.indexOf(u.value)}`,
            role: "tabpanel",
            "aria-labelledby": `yarr-tab-${t.indexOf(u.value)}`,
            tabindex: "0"
          }, [
            u.value === "Overview" ? (S(), Re(Mu, {
              key: 0,
              runtime: s.value,
              config: n.value,
              busy: le.value,
              onControl: Qe,
              onImport: R[0] || (R[0] = (L) => q.value = !0),
              onDiscover: R[1] || (R[1] = (L) => K.value = !0)
            }, null, 8, ["runtime", "config", "busy"])) : u.value === "Services" ? (S(), Re(kc, {
              key: 1,
              services: l.value,
              disabled: le.value,
              onUpdate: R[2] || (R[2] = (L) => l.value = L)
            }, null, 8, ["services", "disabled"])) : u.value === "Server & Auth" ? (S(), Re(mc, {
              key: 2,
              plugin: r.value,
              auth: i.value,
              "bearer-configured": a.value,
              "google-secret-configured": o.value,
              disabled: le.value,
              onPlugin: R[3] || (R[3] = (L) => r.value = L),
              onAuth: R[4] || (R[4] = (L) => i.value = L)
            }, null, 8, ["plugin", "auth", "bearer-configured", "google-secret-configured", "disabled"])) : u.value === "Updates" ? (S(), Re(Qc, {
              key: 3,
              onBusy: R[5] || (R[5] = (L) => y.value = L)
            })) : (S(), Re(Cu, { key: 4 }))
          ], 8, af),
          d("div", uf, [
            d("div", cf, [
              I.value ? (S(), T("p", ff, M(I.value), 1)) : P.value ? (S(), T("p", df, M(P.value), 1)) : (S(), T("p", hf, "Changes are validated again by the Yarr service before they are applied."))
            ]),
            d("button", {
              type: "button",
              class: "yarr-button",
              disabled: le.value,
              onClick: Q
            }, M(p.value ? "Saving..." : "Save changes"), 9, pf)
          ])
        ], 64)) : (S(), T("p", sf, "Loading Yarr operations..."))
      ]),
      ue(fu, {
        open: q.value,
        onClose: R[6] || (R[6] = (L) => q.value = !1),
        onApplied: vt,
        onBusy: R[7] || (R[7] = (L) => y.value = L)
      }, null, 8, ["open"]),
      ue(za, {
        open: K.value,
        onClose: R[8] || (R[8] = (L) => K.value = !1),
        onApplied: vt,
        onBusy: R[9] || (R[9] = (L) => y.value = L)
      }, null, 8, ["open"])
    ], 8, Xc));
  }
}), bf = /* @__PURE__ */ Wl(gf, { shadowRoot: !1 });
customElements.get("yarr-settings-app") || customElements.define("yarr-settings-app", bf);
