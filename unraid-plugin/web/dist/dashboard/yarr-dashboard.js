/**
* @vue/shared v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
// @__NO_SIDE_EFFECTS__
function Ns(e) {
  const t = /* @__PURE__ */ Object.create(null);
  for (const s of e.split(",")) t[s] = 1;
  return (s) => s in t;
}
const q = {}, st = [], Oe = () => {
}, Bn = () => !1, Xt = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // uppercase letter
(e.charCodeAt(2) > 122 || e.charCodeAt(2) < 97), Zt = (e) => e.startsWith("onUpdate:"), X = Object.assign, Ds = (e, t) => {
  const s = e.indexOf(t);
  s > -1 && e.splice(s, 1);
}, ii = Object.prototype.hasOwnProperty, j = (e, t) => ii.call(e, t), P = Array.isArray, nt = (e) => Mt(e) === "[object Map]", Kn = (e) => Mt(e) === "[object Set]", fn = (e) => Mt(e) === "[object Date]", M = (e) => typeof e == "function", Q = (e) => typeof e == "string", Me = (e) => typeof e == "symbol", B = (e) => e !== null && typeof e == "object", Yn = (e) => (B(e) || M(e)) && M(e.then) && M(e.catch), qn = Object.prototype.toString, Mt = (e) => qn.call(e), oi = (e) => Mt(e).slice(8, -1), es = (e) => Mt(e) === "[object Object]", Ls = (e) => Q(e) && e !== "NaN" && e[0] !== "-" && "" + parseInt(e, 10) === e, mt = /* @__PURE__ */ Ns(
  // the leading comma is intentional so empty string "" is also included
  ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted"
), ts = (e) => {
  const t = /* @__PURE__ */ Object.create(null);
  return ((s) => t[s] || (t[s] = e(s)));
}, li = /-\w/g, ue = ts(
  (e) => e.replace(li, (t) => t.slice(1).toUpperCase())
), ci = /\B([A-Z])/g, pe = ts(
  (e) => e.replace(ci, "-$1").toLowerCase()
), Jn = ts((e) => e.charAt(0).toUpperCase() + e.slice(1)), fs = ts(
  (e) => e ? `on${Jn(e)}` : ""
), Ae = (e, t) => !Object.is(e, t), us = (e, ...t) => {
  for (let s = 0; s < e.length; s++)
    e[s](...t);
}, kn = (e, t, s, n = !1) => {
  Object.defineProperty(e, t, {
    configurable: !0,
    enumerable: !1,
    writable: n,
    value: s
  });
}, fi = (e) => {
  const t = parseFloat(e);
  return isNaN(t) ? e : t;
}, un = (e) => {
  const t = Q(e) ? Number(e) : NaN;
  return isNaN(t) ? e : t;
};
let an;
const ss = () => an || (an = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof globalThis < "u" ? globalThis : {});
function js(e) {
  if (P(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++) {
      const n = e[s], r = Q(n) ? di(n) : js(n);
      if (r)
        for (const i in r)
          t[i] = r[i];
    }
    return t;
  } else if (Q(e) || B(e))
    return e;
}
const ui = /;(?![^(]*\))/g, ai = /:([^]+)/, hi = /\/\*[^]*?\*\//g;
function di(e) {
  const t = {};
  return e.replace(hi, "").split(ui).forEach((s) => {
    if (s) {
      const n = s.split(ai);
      n.length > 1 && (t[n[0].trim()] = n[1].trim());
    }
  }), t;
}
function Hs(e) {
  let t = "";
  if (Q(e))
    t = e;
  else if (P(e))
    for (let s = 0; s < e.length; s++) {
      const n = Hs(e[s]);
      n && (t += n + " ");
    }
  else if (B(e))
    for (const s in e)
      e[s] && (t += s + " ");
  return t.trim();
}
const pi = "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly", gi = /* @__PURE__ */ Ns(pi);
function Gn(e) {
  return !!e || e === "";
}
function _i(e, t) {
  if (e.length !== t.length) return !1;
  let s = !0;
  for (let n = 0; s && n < e.length; n++)
    s = $s(e[n], t[n]);
  return s;
}
function $s(e, t) {
  if (e === t) return !0;
  let s = fn(e), n = fn(t);
  if (s || n)
    return s && n ? e.getTime() === t.getTime() : !1;
  if (s = Me(e), n = Me(t), s || n)
    return e === t;
  if (s = P(e), n = P(t), s || n)
    return s && n ? _i(e, t) : !1;
  if (s = B(e), n = B(t), s || n) {
    if (!s || !n)
      return !1;
    const r = Object.keys(e).length, i = Object.keys(t).length;
    if (r !== i)
      return !1;
    for (const o in e) {
      const l = e.hasOwnProperty(o), c = t.hasOwnProperty(o);
      if (l && !c || !l && c || !$s(e[o], t[o]))
        return !1;
    }
  }
  return String(e) === String(t);
}
const zn = (e) => !!(e && e.__v_isRef === !0), Fe = (e) => Q(e) ? e : e == null ? "" : P(e) || B(e) && (e.toString === qn || !M(e.toString)) ? zn(e) ? Fe(e.value) : JSON.stringify(e, Qn, 2) : String(e), Qn = (e, t) => zn(t) ? Qn(e, t.value) : nt(t) ? {
  [`Map(${t.size})`]: [...t.entries()].reduce(
    (s, [n, r], i) => (s[as(n, i) + " =>"] = r, s),
    {}
  )
} : Kn(t) ? {
  [`Set(${t.size})`]: [...t.values()].map((s) => as(s))
} : Me(t) ? as(t) : B(t) && !P(t) && !es(t) ? String(t) : t, as = (e, t = "") => {
  var s;
  return (
    // Symbol.description in es2019+ so we need to cast here to pass
    // the lib: es2016 check
    Me(e) ? `Symbol(${(s = e.description) != null ? s : t})` : e
  );
};
/**
* @vue/reactivity v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let te;
class mi {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t = !1) {
    this.detached = t, this._active = !0, this._on = 0, this.effects = [], this.cleanups = [], this._isPaused = !1, this._warnOnRun = !0, this.__v_skip = !0, !t && te && (te.active ? (this.parent = te, this.index = (te.scopes || (te.scopes = [])).push(
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
      const s = te;
      try {
        return te = this, t();
      } finally {
        te = s;
      }
    }
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  on() {
    ++this._on === 1 && (this.prevScope = te, te = this);
  }
  /**
   * This should only be called on non-detached scopes
   * @internal
   */
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (te === this)
        te = this.prevScope;
      else {
        let t = te;
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
function bi() {
  return te;
}
let Y;
const hs = /* @__PURE__ */ new WeakSet();
class Xn {
  constructor(t) {
    this.fn = t, this.deps = void 0, this.depsTail = void 0, this.flags = 5, this.next = void 0, this.cleanup = void 0, this.scheduler = void 0, te && (te.active ? te.effects.push(this) : this.flags &= -2);
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 && (this.flags &= -65, hs.has(this) && (hs.delete(this), this.trigger()));
  }
  /**
   * @internal
   */
  notify() {
    this.flags & 2 && !(this.flags & 32) || this.flags & 8 || er(this);
  }
  run() {
    if (!(this.flags & 1))
      return this.fn();
    this.flags |= 2, hn(this), tr(this);
    const t = Y, s = ge;
    Y = this, ge = !0;
    try {
      return this.fn();
    } finally {
      sr(this), Y = t, ge = s, this.flags &= -3;
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let t = this.deps; t; t = t.nextDep)
        Ws(t);
      this.deps = this.depsTail = void 0, hn(this), this.onStop && this.onStop(), this.flags &= -2;
    }
  }
  trigger() {
    this.flags & 64 ? hs.add(this) : this.scheduler ? this.scheduler() : this.runIfDirty();
  }
  /**
   * @internal
   */
  runIfDirty() {
    xs(this) && this.run();
  }
  get dirty() {
    return xs(this);
  }
}
let Zn = 0, bt, yt;
function er(e, t = !1) {
  if (e.flags |= 8, t) {
    e.next = yt, yt = e;
    return;
  }
  e.next = bt, bt = e;
}
function Vs() {
  Zn++;
}
function Us() {
  if (--Zn > 0)
    return;
  if (yt) {
    let t = yt;
    for (yt = void 0; t; ) {
      const s = t.next;
      t.next = void 0, t.flags &= -9, t = s;
    }
  }
  let e;
  for (; bt; ) {
    let t = bt;
    for (bt = void 0; t; ) {
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
function tr(e) {
  for (let t = e.deps; t; t = t.nextDep)
    t.version = -1, t.prevActiveLink = t.dep.activeLink, t.dep.activeLink = t;
}
function sr(e) {
  let t, s = e.depsTail, n = s;
  for (; n; ) {
    const r = n.prevDep;
    n.version === -1 ? (n === s && (s = r), Ws(n), yi(n)) : t = n, n.dep.activeLink = n.prevActiveLink, n.prevActiveLink = void 0, n = r;
  }
  e.deps = t, e.depsTail = s;
}
function xs(e) {
  for (let t = e.deps; t; t = t.nextDep)
    if (t.dep.version !== t.version || t.dep.computed && (nr(t.dep.computed) || t.dep.version !== t.version))
      return !0;
  return !!e._dirty;
}
function nr(e) {
  if (e.flags & 4 && !(e.flags & 16) || (e.flags &= -17, e.globalVersion === Ct) || (e.globalVersion = Ct, !e.isSSR && e.flags & 128 && (!e.deps && !e._dirty || !xs(e))))
    return;
  e.flags |= 2;
  const t = e.dep, s = Y, n = ge;
  Y = e, ge = !0;
  try {
    tr(e);
    const r = e.fn(e._value);
    (t.version === 0 || Ae(r, e._value)) && (e.flags |= 128, e._value = r, t.version++);
  } catch (r) {
    throw t.version++, r;
  } finally {
    Y = s, ge = n, sr(e), e.flags &= -3;
  }
}
function Ws(e, t = !1) {
  const { dep: s, prevSub: n, nextSub: r } = e;
  if (n && (n.nextSub = r, e.prevSub = void 0), r && (r.prevSub = n, e.nextSub = void 0), s.subs === e && (s.subs = n, !n && s.computed)) {
    s.computed.flags &= -5;
    for (let i = s.computed.deps; i; i = i.nextDep)
      Ws(i, !0);
  }
  !t && !--s.sc && s.map && s.map.delete(s.key);
}
function yi(e) {
  const { prevDep: t, nextDep: s } = e;
  t && (t.nextDep = s, e.prevDep = void 0), s && (s.prevDep = t, e.nextDep = void 0);
}
let ge = !0;
const rr = [];
function je() {
  rr.push(ge), ge = !1;
}
function He() {
  const e = rr.pop();
  ge = e === void 0 ? !0 : e;
}
function hn(e) {
  const { cleanup: t } = e;
  if (e.cleanup = void 0, t) {
    const s = Y;
    Y = void 0;
    try {
      t();
    } finally {
      Y = s;
    }
  }
}
let Ct = 0;
class vi {
  constructor(t, s) {
    this.sub = t, this.dep = s, this.version = s.version, this.nextDep = this.prevDep = this.nextSub = this.prevSub = this.prevActiveLink = void 0;
  }
}
class Bs {
  // TODO isolatedDeclarations "__v_skip"
  constructor(t) {
    this.computed = t, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, this.__v_skip = !0;
  }
  track(t) {
    if (!Y || !ge || Y === this.computed)
      return;
    let s = this.activeLink;
    if (s === void 0 || s.sub !== Y)
      s = this.activeLink = new vi(Y, this), Y.deps ? (s.prevDep = Y.depsTail, Y.depsTail.nextDep = s, Y.depsTail = s) : Y.deps = Y.depsTail = s, ir(s);
    else if (s.version === -1 && (s.version = this.version, s.nextDep)) {
      const n = s.nextDep;
      n.prevDep = s.prevDep, s.prevDep && (s.prevDep.nextDep = n), s.prevDep = Y.depsTail, s.nextDep = void 0, Y.depsTail.nextDep = s, Y.depsTail = s, Y.deps === s && (Y.deps = n);
    }
    return s;
  }
  trigger(t) {
    this.version++, Ct++, this.notify(t);
  }
  notify(t) {
    Vs();
    try {
      for (let s = this.subs; s; s = s.prevSub)
        s.sub.notify() && s.sub.dep.notify();
    } finally {
      Us();
    }
  }
}
function ir(e) {
  if (e.dep.sc++, e.sub.flags & 4) {
    const t = e.dep.computed;
    if (t && !e.dep.subs) {
      t.flags |= 20;
      for (let n = t.deps; n; n = n.nextDep)
        ir(n);
    }
    const s = e.dep.subs;
    s !== e && (e.prevSub = s, s && (s.nextSub = e)), e.dep.subs = e;
  }
}
const Ss = /* @__PURE__ */ new WeakMap(), Qe = /* @__PURE__ */ Symbol(
  ""
), Es = /* @__PURE__ */ Symbol(
  ""
), Tt = /* @__PURE__ */ Symbol(
  ""
);
function se(e, t, s) {
  if (ge && Y) {
    let n = Ss.get(e);
    n || Ss.set(e, n = /* @__PURE__ */ new Map());
    let r = n.get(s);
    r || (n.set(s, r = new Bs()), r.map = n, r.key = s), r.track();
  }
}
function Le(e, t, s, n, r, i) {
  const o = Ss.get(e);
  if (!o) {
    Ct++;
    return;
  }
  const l = (c) => {
    c && c.trigger();
  };
  if (Vs(), t === "clear")
    o.forEach(l);
  else {
    const c = P(e), h = c && Ls(s);
    if (c && s === "length") {
      const a = Number(n);
      o.forEach((p, S) => {
        (S === "length" || S === Tt || !Me(S) && S >= a) && l(p);
      });
    } else
      switch ((s !== void 0 || o.has(void 0)) && l(o.get(s)), h && l(o.get(Tt)), t) {
        case "add":
          c ? h && l(o.get("length")) : (l(o.get(Qe)), nt(e) && l(o.get(Es)));
          break;
        case "delete":
          c || (l(o.get(Qe)), nt(e) && l(o.get(Es)));
          break;
        case "set":
          nt(e) && l(o.get(Qe));
          break;
      }
  }
  Us();
}
function Ze(e) {
  const t = /* @__PURE__ */ $(e);
  return t === e ? t : (se(t, "iterate", Tt), /* @__PURE__ */ _e(e) ? t : t.map($e));
}
function Ks(e) {
  return se(e = /* @__PURE__ */ $(e), "iterate", Tt), e;
}
function Ee(e, t) {
  return /* @__PURE__ */ Be(e) ? At(/* @__PURE__ */ rt(e) ? $e(t) : t) : $e(t);
}
const wi = {
  __proto__: null,
  [Symbol.iterator]() {
    return ds(this, Symbol.iterator, (e) => Ee(this, e));
  },
  concat(...e) {
    return Ze(this).concat(
      ...e.map((t) => P(t) ? Ze(t) : t)
    );
  },
  entries() {
    return ds(this, "entries", (e) => (e[1] = Ee(this, e[1]), e));
  },
  every(e, t) {
    return Ie(this, "every", e, t, void 0, arguments);
  },
  filter(e, t) {
    return Ie(
      this,
      "filter",
      e,
      t,
      (s) => s.map((n) => Ee(this, n)),
      arguments
    );
  },
  find(e, t) {
    return Ie(
      this,
      "find",
      e,
      t,
      (s) => Ee(this, s),
      arguments
    );
  },
  findIndex(e, t) {
    return Ie(this, "findIndex", e, t, void 0, arguments);
  },
  findLast(e, t) {
    return Ie(
      this,
      "findLast",
      e,
      t,
      (s) => Ee(this, s),
      arguments
    );
  },
  findLastIndex(e, t) {
    return Ie(this, "findLastIndex", e, t, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(e, t) {
    return Ie(this, "forEach", e, t, void 0, arguments);
  },
  includes(...e) {
    return ps(this, "includes", e);
  },
  indexOf(...e) {
    return ps(this, "indexOf", e);
  },
  join(e) {
    return Ze(this).join(e);
  },
  // keys() iterator only reads `length`, no optimization required
  lastIndexOf(...e) {
    return ps(this, "lastIndexOf", e);
  },
  map(e, t) {
    return Ie(this, "map", e, t, void 0, arguments);
  },
  pop() {
    return ht(this, "pop");
  },
  push(...e) {
    return ht(this, "push", e);
  },
  reduce(e, ...t) {
    return dn(this, "reduce", e, t);
  },
  reduceRight(e, ...t) {
    return dn(this, "reduceRight", e, t);
  },
  shift() {
    return ht(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(e, t) {
    return Ie(this, "some", e, t, void 0, arguments);
  },
  splice(...e) {
    return ht(this, "splice", e);
  },
  toReversed() {
    return Ze(this).toReversed();
  },
  toSorted(e) {
    return Ze(this).toSorted(e);
  },
  toSpliced(...e) {
    return Ze(this).toSpliced(...e);
  },
  unshift(...e) {
    return ht(this, "unshift", e);
  },
  values() {
    return ds(this, "values", (e) => Ee(this, e));
  }
};
function ds(e, t, s) {
  const n = Ks(e), r = n[t]();
  return n !== e && !/* @__PURE__ */ _e(e) && (r._next = r.next, r.next = () => {
    const i = r._next();
    return i.done || (i.value = s(i.value)), i;
  }), r;
}
const xi = Array.prototype;
function Ie(e, t, s, n, r, i) {
  const o = Ks(e), l = o !== e && !/* @__PURE__ */ _e(e), c = o[t];
  if (c !== xi[t]) {
    const p = c.apply(e, i);
    return l ? $e(p) : p;
  }
  let h = s;
  o !== e && (l ? h = function(p, S) {
    return s.call(this, Ee(e, p), S, e);
  } : s.length > 2 && (h = function(p, S) {
    return s.call(this, p, S, e);
  }));
  const a = c.call(o, h, n);
  return l && r ? r(a) : a;
}
function dn(e, t, s, n) {
  const r = Ks(e), i = r !== e && !/* @__PURE__ */ _e(e);
  let o = s, l = !1;
  r !== e && (i ? (l = n.length === 0, o = function(h, a, p) {
    return l && (l = !1, h = Ee(e, h)), s.call(this, h, Ee(e, a), p, e);
  }) : s.length > 3 && (o = function(h, a, p) {
    return s.call(this, h, a, p, e);
  }));
  const c = r[t](o, ...n);
  return l ? Ee(e, c) : c;
}
function ps(e, t, s) {
  const n = /* @__PURE__ */ $(e);
  se(n, "iterate", Tt);
  const r = n[t](...s);
  return (r === -1 || r === !1) && /* @__PURE__ */ ks(s[0]) ? (s[0] = /* @__PURE__ */ $(s[0]), n[t](...s)) : r;
}
function ht(e, t, s = []) {
  je(), Vs();
  const n = (/* @__PURE__ */ $(e))[t].apply(e, s);
  return Us(), He(), n;
}
const Si = /* @__PURE__ */ Ns("__proto__,__v_isRef,__isVue"), or = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((e) => e !== "arguments" && e !== "caller").map((e) => Symbol[e]).filter(Me)
);
function Ei(e) {
  Me(e) || (e = String(e));
  const t = /* @__PURE__ */ $(this);
  return se(t, "has", e), t.hasOwnProperty(e);
}
class lr {
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
      return n === (r ? i ? Ni : ar : i ? ur : fr).get(t) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(t) === Object.getPrototypeOf(n) ? t : void 0;
    const o = P(t);
    if (!r) {
      let c;
      if (o && (c = wi[s]))
        return c;
      if (s === "hasOwnProperty")
        return Ei;
    }
    const l = Reflect.get(
      t,
      s,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      /* @__PURE__ */ ne(t) ? t : n
    );
    if ((Me(s) ? or.has(s) : Si(s)) || (r || se(t, "get", s), i))
      return l;
    if (/* @__PURE__ */ ne(l)) {
      const c = o && Ls(s) ? l : l.value;
      return r && B(c) ? /* @__PURE__ */ Ts(c) : c;
    }
    return B(l) ? r ? /* @__PURE__ */ Ts(l) : /* @__PURE__ */ qs(l) : l;
  }
}
class cr extends lr {
  constructor(t = !1) {
    super(!1, t);
  }
  set(t, s, n, r) {
    let i = t[s];
    const o = P(t) && Ls(s);
    if (!this._isShallow) {
      const h = /* @__PURE__ */ Be(i);
      if (!/* @__PURE__ */ _e(n) && !/* @__PURE__ */ Be(n) && (i = /* @__PURE__ */ $(i), n = /* @__PURE__ */ $(n)), !o && /* @__PURE__ */ ne(i) && !/* @__PURE__ */ ne(n))
        return h || (i.value = n), !0;
    }
    const l = o ? Number(s) < t.length : j(t, s), c = Reflect.set(
      t,
      s,
      n,
      /* @__PURE__ */ ne(t) ? t : r
    );
    return t === /* @__PURE__ */ $(r) && c && (l ? Ae(n, i) && Le(t, "set", s, n) : Le(t, "add", s, n)), c;
  }
  deleteProperty(t, s) {
    const n = j(t, s);
    t[s];
    const r = Reflect.deleteProperty(t, s);
    return r && n && Le(t, "delete", s, void 0), r;
  }
  has(t, s) {
    const n = Reflect.has(t, s);
    return (!Me(s) || !or.has(s)) && se(t, "has", s), n;
  }
  ownKeys(t) {
    return se(
      t,
      "iterate",
      P(t) ? "length" : Qe
    ), Reflect.ownKeys(t);
  }
}
class Ci extends lr {
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
const Ti = /* @__PURE__ */ new cr(), Ai = /* @__PURE__ */ new Ci(), Ri = /* @__PURE__ */ new cr(!0);
const Cs = (e) => e, $t = (e) => Reflect.getPrototypeOf(e);
function Oi(e, t, s) {
  return function(...n) {
    const r = this.__v_raw, i = /* @__PURE__ */ $(r), o = nt(i), l = e === "entries" || e === Symbol.iterator && o, c = e === "keys" && o, h = r[e](...n), a = s ? Cs : t ? At : $e;
    return !t && se(
      i,
      "iterate",
      c ? Es : Qe
    ), X(
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
function Vt(e) {
  return function(...t) {
    return e === "delete" ? !1 : e === "clear" ? void 0 : this;
  };
}
function Pi(e, t) {
  const s = {
    get(r) {
      const i = this.__v_raw, o = /* @__PURE__ */ $(i), l = /* @__PURE__ */ $(r);
      e || (Ae(r, l) && se(o, "get", r), se(o, "get", l));
      const { has: c } = $t(o), h = t ? Cs : e ? At : $e;
      if (c.call(o, r))
        return h(i.get(r));
      if (c.call(o, l))
        return h(i.get(l));
      i !== o && i.get(r);
    },
    get size() {
      const r = this.__v_raw;
      return !e && se(/* @__PURE__ */ $(r), "iterate", Qe), r.size;
    },
    has(r) {
      const i = this.__v_raw, o = /* @__PURE__ */ $(i), l = /* @__PURE__ */ $(r);
      return e || (Ae(r, l) && se(o, "has", r), se(o, "has", l)), r === l ? i.has(r) : i.has(r) || i.has(l);
    },
    forEach(r, i) {
      const o = this, l = o.__v_raw, c = /* @__PURE__ */ $(l), h = t ? Cs : e ? At : $e;
      return !e && se(c, "iterate", Qe), l.forEach((a, p) => r.call(i, h(a), h(p), o));
    }
  };
  return X(
    s,
    e ? {
      add: Vt("add"),
      set: Vt("set"),
      delete: Vt("delete"),
      clear: Vt("clear")
    } : {
      add(r) {
        const i = /* @__PURE__ */ $(this), o = $t(i), l = /* @__PURE__ */ $(r), c = !t && !/* @__PURE__ */ _e(r) && !/* @__PURE__ */ Be(r) ? l : r;
        return o.has.call(i, c) || Ae(r, c) && o.has.call(i, r) || Ae(l, c) && o.has.call(i, l) || (i.add(c), Le(i, "add", c, c)), this;
      },
      set(r, i) {
        !t && !/* @__PURE__ */ _e(i) && !/* @__PURE__ */ Be(i) && (i = /* @__PURE__ */ $(i));
        const o = /* @__PURE__ */ $(this), { has: l, get: c } = $t(o);
        let h = l.call(o, r);
        h || (r = /* @__PURE__ */ $(r), h = l.call(o, r));
        const a = c.call(o, r);
        return o.set(r, i), h ? Ae(i, a) && Le(o, "set", r, i) : Le(o, "add", r, i), this;
      },
      delete(r) {
        const i = /* @__PURE__ */ $(this), { has: o, get: l } = $t(i);
        let c = o.call(i, r);
        c || (r = /* @__PURE__ */ $(r), c = o.call(i, r)), l && l.call(i, r);
        const h = i.delete(r);
        return c && Le(i, "delete", r, void 0), h;
      },
      clear() {
        const r = /* @__PURE__ */ $(this), i = r.size !== 0, o = r.clear();
        return i && Le(
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
    s[r] = Oi(r, e, t);
  }), s;
}
function Ys(e, t) {
  const s = Pi(e, t);
  return (n, r, i) => r === "__v_isReactive" ? !e : r === "__v_isReadonly" ? e : r === "__v_raw" ? n : Reflect.get(
    j(s, r) && r in n ? s : n,
    r,
    i
  );
}
const Mi = {
  get: /* @__PURE__ */ Ys(!1, !1)
}, Ii = {
  get: /* @__PURE__ */ Ys(!1, !0)
}, Fi = {
  get: /* @__PURE__ */ Ys(!0, !1)
};
const fr = /* @__PURE__ */ new WeakMap(), ur = /* @__PURE__ */ new WeakMap(), ar = /* @__PURE__ */ new WeakMap(), Ni = /* @__PURE__ */ new WeakMap();
function Di(e) {
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
function qs(e) {
  return /* @__PURE__ */ Be(e) ? e : Js(
    e,
    !1,
    Ti,
    Mi,
    fr
  );
}
// @__NO_SIDE_EFFECTS__
function Li(e) {
  return Js(
    e,
    !1,
    Ri,
    Ii,
    ur
  );
}
// @__NO_SIDE_EFFECTS__
function Ts(e) {
  return Js(
    e,
    !0,
    Ai,
    Fi,
    ar
  );
}
function Js(e, t, s, n, r) {
  if (!B(e) || e.__v_raw && !(t && e.__v_isReactive) || e.__v_skip || !Object.isExtensible(e))
    return e;
  const i = r.get(e);
  if (i)
    return i;
  const o = Di(oi(e));
  if (o === 0)
    return e;
  const l = new Proxy(
    e,
    o === 2 ? n : s
  );
  return r.set(e, l), l;
}
// @__NO_SIDE_EFFECTS__
function rt(e) {
  return /* @__PURE__ */ Be(e) ? /* @__PURE__ */ rt(e.__v_raw) : !!(e && e.__v_isReactive);
}
// @__NO_SIDE_EFFECTS__
function Be(e) {
  return !!(e && e.__v_isReadonly);
}
// @__NO_SIDE_EFFECTS__
function _e(e) {
  return !!(e && e.__v_isShallow);
}
// @__NO_SIDE_EFFECTS__
function ks(e) {
  return e ? !!e.__v_raw : !1;
}
// @__NO_SIDE_EFFECTS__
function $(e) {
  const t = e && e.__v_raw;
  return t ? /* @__PURE__ */ $(t) : e;
}
function ji(e) {
  return !j(e, "__v_skip") && Object.isExtensible(e) && kn(e, "__v_skip", !0), e;
}
const $e = (e) => B(e) ? /* @__PURE__ */ qs(e) : e, At = (e) => B(e) ? /* @__PURE__ */ Ts(e) : e;
// @__NO_SIDE_EFFECTS__
function ne(e) {
  return e ? e.__v_isRef === !0 : !1;
}
// @__NO_SIDE_EFFECTS__
function Ut(e) {
  return Hi(e, !1);
}
function Hi(e, t) {
  return /* @__PURE__ */ ne(e) ? e : new $i(e, t);
}
class $i {
  constructor(t, s) {
    this.dep = new Bs(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = s ? t : /* @__PURE__ */ $(t), this._value = s ? t : $e(t), this.__v_isShallow = s;
  }
  get value() {
    return this.dep.track(), this._value;
  }
  set value(t) {
    const s = this._rawValue, n = this.__v_isShallow || /* @__PURE__ */ _e(t) || /* @__PURE__ */ Be(t);
    t = n ? t : /* @__PURE__ */ $(t), Ae(t, s) && (this._rawValue = t, this._value = n ? t : $e(t), this.dep.trigger());
  }
}
function hr(e) {
  return /* @__PURE__ */ ne(e) ? e.value : e;
}
const Vi = {
  get: (e, t, s) => t === "__v_raw" ? e : hr(Reflect.get(e, t, s)),
  set: (e, t, s, n) => {
    const r = e[t];
    return /* @__PURE__ */ ne(r) && !/* @__PURE__ */ ne(s) ? (r.value = s, !0) : Reflect.set(e, t, s, n);
  }
};
function dr(e) {
  return /* @__PURE__ */ rt(e) ? e : new Proxy(e, Vi);
}
class Ui {
  constructor(t, s, n) {
    this.fn = t, this.setter = s, this._value = void 0, this.dep = new Bs(this), this.__v_isRef = !0, this.deps = void 0, this.depsTail = void 0, this.flags = 16, this.globalVersion = Ct - 1, this.next = void 0, this.effect = this, this.__v_isReadonly = !s, this.isSSR = n;
  }
  /**
   * @internal
   */
  notify() {
    if (this.flags |= 16, !(this.flags & 8) && // avoid infinite self recursion
    Y !== this)
      return er(this, !0), !0;
  }
  get value() {
    const t = this.dep.track();
    return nr(this), t && (t.version = this.dep.version), this._value;
  }
  set value(t) {
    this.setter && this.setter(t);
  }
}
// @__NO_SIDE_EFFECTS__
function Wi(e, t, s = !1) {
  let n, r;
  return M(e) ? n = e : (n = e.get, r = e.set), new Ui(n, r, s);
}
const Wt = {}, Yt = /* @__PURE__ */ new WeakMap();
let ze;
function Bi(e, t = !1, s = ze) {
  if (s) {
    let n = Yt.get(s);
    n || Yt.set(s, n = []), n.push(e);
  }
}
function Ki(e, t, s = q) {
  const { immediate: n, deep: r, once: i, scheduler: o, augmentJob: l, call: c } = s, h = (T) => r ? T : /* @__PURE__ */ _e(T) || r === !1 || r === 0 ? We(T, 1) : We(T);
  let a, p, S, E, L = !1, R = !1;
  if (/* @__PURE__ */ ne(e) ? (p = () => e.value, L = /* @__PURE__ */ _e(e)) : /* @__PURE__ */ rt(e) ? (p = () => h(e), L = !0) : P(e) ? (R = !0, L = e.some((T) => /* @__PURE__ */ rt(T) || /* @__PURE__ */ _e(T)), p = () => e.map((T) => {
    if (/* @__PURE__ */ ne(T))
      return T.value;
    if (/* @__PURE__ */ rt(T))
      return h(T);
    if (M(T))
      return c ? c(T, 2) : T();
  })) : M(e) ? t ? p = c ? () => c(e, 2) : e : p = () => {
    if (S) {
      je();
      try {
        S();
      } finally {
        He();
      }
    }
    const T = ze;
    ze = a;
    try {
      return c ? c(e, 3, [E]) : e(E);
    } finally {
      ze = T;
    }
  } : p = Oe, t && r) {
    const T = p, J = r === !0 ? 1 / 0 : r;
    p = () => We(T(), J);
  }
  const k = bi(), H = () => {
    a.stop(), k && k.active && Ds(k.effects, a);
  };
  if (i && t) {
    const T = t;
    t = (...J) => {
      const D = T(...J);
      return H(), D;
    };
  }
  let I = R ? new Array(e.length).fill(Wt) : Wt;
  const V = (T) => {
    if (!(!(a.flags & 1) || !a.dirty && !T))
      if (t) {
        const J = a.run();
        if (T || r || L || (R ? J.some((D, F) => Ae(D, I[F])) : Ae(J, I))) {
          S && S();
          const D = ze;
          ze = a;
          try {
            const F = [
              J,
              // pass undefined as the old value when it's changed for the first time
              I === Wt ? void 0 : R && I[0] === Wt ? [] : I,
              E
            ];
            I = J, c ? c(t, 3, F) : (
              // @ts-expect-error
              t(...F)
            );
          } finally {
            ze = D;
          }
        }
      } else
        a.run();
  };
  return l && l(V), a = new Xn(p), a.scheduler = o ? () => o(V, !1) : V, E = (T) => Bi(T, !1, a), S = a.onStop = () => {
    const T = Yt.get(a);
    if (T) {
      if (c)
        c(T, 4);
      else
        for (const J of T) J();
      Yt.delete(a);
    }
  }, t ? n ? V(!0) : I = a.run() : o ? o(V.bind(null, !0), !0) : a.run(), H.pause = a.pause.bind(a), H.resume = a.resume.bind(a), H.stop = H, H;
}
function We(e, t = 1 / 0, s) {
  if (t <= 0 || !B(e) || e.__v_skip || (s = s || /* @__PURE__ */ new Map(), (s.get(e) || 0) >= t))
    return e;
  if (s.set(e, t), t--, /* @__PURE__ */ ne(e))
    We(e.value, t, s);
  else if (P(e))
    for (let n = 0; n < e.length; n++)
      We(e[n], t, s);
  else if (Kn(e) || nt(e))
    e.forEach((n) => {
      We(n, t, s);
    });
  else if (es(e)) {
    for (const n in e)
      We(e[n], t, s);
    for (const n of Object.getOwnPropertySymbols(e))
      Object.prototype.propertyIsEnumerable.call(e, n) && We(e[n], t, s);
  }
  return e;
}
/**
* @vue/runtime-core v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function It(e, t, s, n) {
  try {
    return n ? e(...n) : e();
  } catch (r) {
    ns(r, t, s);
  }
}
function me(e, t, s, n) {
  if (M(e)) {
    const r = It(e, t, s, n);
    return r && Yn(r) && r.catch((i) => {
      ns(i, t, s);
    }), r;
  }
  if (P(e)) {
    const r = [];
    for (let i = 0; i < e.length; i++)
      r.push(me(e[i], t, s, n));
    return r;
  }
}
function ns(e, t, s, n = !0) {
  const r = t ? t.vnode : null, { errorHandler: i, throwUnhandledErrorInProduction: o } = t && t.appContext.config || q;
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
      je(), It(i, null, 10, [
        e,
        c,
        h
      ]), He();
      return;
    }
  }
  Yi(e, s, r, n, o);
}
function Yi(e, t, s, n = !0, r = !1) {
  if (r)
    throw e;
  console.error(e);
}
const oe = [];
let Se = -1;
const it = [];
let Ue = null, et = 0;
const pr = /* @__PURE__ */ Promise.resolve();
let qt = null;
function gr(e) {
  const t = qt || pr;
  return e ? t.then(this ? e.bind(this) : e) : t;
}
function qi(e) {
  let t = Se + 1, s = oe.length;
  for (; t < s; ) {
    const n = t + s >>> 1, r = oe[n], i = Rt(r);
    i < e || i === e && r.flags & 2 ? t = n + 1 : s = n;
  }
  return t;
}
function Gs(e) {
  if (!(e.flags & 1)) {
    const t = Rt(e), s = oe[oe.length - 1];
    !s || // fast path when the job id is larger than the tail
    !(e.flags & 2) && t >= Rt(s) ? oe.push(e) : oe.splice(qi(t), 0, e), e.flags |= 1, _r();
  }
}
function _r() {
  qt || (qt = pr.then(br));
}
function Ji(e) {
  P(e) ? it.push(...e) : Ue && e.id === -1 ? Ue.splice(et + 1, 0, e) : e.flags & 1 || (it.push(e), e.flags |= 1), _r();
}
function pn(e, t, s = Se + 1) {
  for (; s < oe.length; s++) {
    const n = oe[s];
    if (n && n.flags & 2) {
      if (e && n.id !== e.uid)
        continue;
      oe.splice(s, 1), s--, n.flags & 4 && (n.flags &= -2), n(), n.flags & 4 || (n.flags &= -2);
    }
  }
}
function mr(e) {
  if (it.length) {
    const t = [...new Set(it)].sort(
      (s, n) => Rt(s) - Rt(n)
    );
    if (it.length = 0, Ue) {
      Ue.push(...t);
      return;
    }
    for (Ue = t, et = 0; et < Ue.length; et++) {
      const s = Ue[et];
      s.flags & 4 && (s.flags &= -2), s.flags & 8 || s(), s.flags &= -2;
    }
    Ue = null, et = 0;
  }
}
const Rt = (e) => e.id == null ? e.flags & 2 ? -1 : 1 / 0 : e.id;
function br(e) {
  try {
    for (Se = 0; Se < oe.length; Se++) {
      const t = oe[Se];
      t && !(t.flags & 8) && (t.flags & 4 && (t.flags &= -2), It(
        t,
        t.i,
        t.i ? 15 : 14
      ), t.flags & 4 || (t.flags &= -2));
    }
  } finally {
    for (; Se < oe.length; Se++) {
      const t = oe[Se];
      t && (t.flags &= -2);
    }
    Se = -1, oe.length = 0, mr(), qt = null, (oe.length || it.length) && br();
  }
}
let Re = null, yr = null;
function Jt(e) {
  const t = Re;
  return Re = e, yr = e && e.type.__scopeId || null, t;
}
function ki(e, t = Re, s) {
  if (!t || e._n)
    return e;
  const n = (...r) => {
    n._d && Cn(-1);
    const i = Jt(t), o = Xe.length;
    let l;
    try {
      l = e(...r);
    } finally {
      for (let c = Xe.length; c > o; c--) qr();
      Jt(i), n._d && Cn(1);
    }
    return l;
  };
  return n._n = !0, n._c = !0, n._d = !0, n;
}
function ke(e, t, s, n) {
  const r = e.dirs, i = t && t.dirs;
  for (let o = 0; o < r.length; o++) {
    const l = r[o];
    i && (l.oldValue = i[o].value);
    let c = l.dir[n];
    c && (je(), me(c, s, 8, [
      e.el,
      l,
      e,
      t
    ]), He());
  }
}
function Gi(e, t) {
  if (le) {
    let s = le.provides;
    const n = le.parent && le.parent.provides;
    n === s && (s = le.provides = Object.create(n)), s[e] = t;
  }
}
function Bt(e, t, s = !1) {
  const n = ko();
  if (n || ot) {
    let r = ot ? ot._context.provides : n ? n.parent == null || n.ce ? n.vnode.appContext && n.vnode.appContext.provides : n.parent.provides : void 0;
    if (r && e in r)
      return r[e];
    if (arguments.length > 1)
      return s && M(t) ? t.call(n && n.proxy) : t;
  }
}
const zi = /* @__PURE__ */ Symbol.for("v-scx"), Qi = () => Bt(zi);
function gs(e, t, s) {
  return vr(e, t, s);
}
function vr(e, t, s = q) {
  const { immediate: n, deep: r, flush: i, once: o } = s, l = X({}, s), c = t && n || !t && i !== "post";
  let h;
  if (Pt) {
    if (i === "sync") {
      const E = Qi();
      h = E.__watcherHandles || (E.__watcherHandles = []);
    } else if (!c) {
      const E = () => {
      };
      return E.stop = Oe, E.resume = Oe, E.pause = Oe, E;
    }
  }
  const a = le;
  l.call = (E, L, R) => me(E, a, L, R);
  let p = !1;
  i === "post" ? l.scheduler = (E) => {
    ce(E, a && a.suspense);
  } : i !== "sync" && (p = !0, l.scheduler = (E, L) => {
    L ? E() : Gs(E);
  }), l.augmentJob = (E) => {
    t && (E.flags |= 4), p && (E.flags |= 2, a && (E.id = a.uid, E.i = a));
  };
  const S = Ki(e, t, l);
  return Pt && (h ? h.push(S) : c && S()), S;
}
function Xi(e, t, s) {
  const n = this.proxy, r = Q(e) ? e.includes(".") ? wr(n, e) : () => n[e] : e.bind(n, n);
  let i;
  M(t) ? i = t : (i = t.handler, s = t);
  const o = Ft(this), l = vr(r, i.bind(n), s);
  return o(), l;
}
function wr(e, t) {
  const s = t.split(".");
  return () => {
    let n = e;
    for (let r = 0; r < s.length && n; r++)
      n = n[s[r]];
    return n;
  };
}
const Zi = /* @__PURE__ */ Symbol("_vte"), eo = (e) => e.__isTeleport, _s = /* @__PURE__ */ Symbol("_leaveCb");
function zs(e, t) {
  e.shapeFlag & 6 && e.component ? (e.transition = t, zs(e.component.subTree, t)) : e.shapeFlag & 128 ? (e.ssContent.transition = t.clone(e.ssContent), e.ssFallback.transition = t.clone(e.ssFallback)) : e.transition = t;
}
// @__NO_SIDE_EFFECTS__
function xr(e, t) {
  return M(e) ? (
    // #8236: extend call and options.name access are considered side-effects
    // by Rollup, so we have to wrap it in a pure-annotated IIFE.
    X({ name: e.name }, t, { setup: e })
  ) : e;
}
function Sr(e) {
  e.ids = [e.ids[0] + e.ids[2]++ + "-", 0, 0];
}
function gn(e, t) {
  let s;
  return !!((s = Object.getOwnPropertyDescriptor(e, t)) && !s.configurable);
}
const kt = /* @__PURE__ */ new WeakMap();
function vt(e, t, s, n, r = !1) {
  if (P(e)) {
    e.forEach(
      (R, k) => vt(
        R,
        t && (P(t) ? t[k] : t),
        s,
        n,
        r
      )
    );
    return;
  }
  if (wt(n) && !r) {
    n.shapeFlag & 512 && n.type.__asyncResolved && n.component.subTree.component && vt(e, t, s, n.component.subTree);
    return;
  }
  const i = n.shapeFlag & 4 ? Zs(n.component) : n.el, o = r ? null : i, { i: l, r: c } = e, h = t && t.r, a = l.refs === q ? l.refs = {} : l.refs, p = l.setupState, S = /* @__PURE__ */ $(p), E = p === q ? Bn : (R) => gn(a, R) ? !1 : j(S, R), L = (R, k) => !(k && gn(a, k));
  if (h != null && h !== c) {
    if (_n(t), Q(h))
      a[h] = null, E(h) && (p[h] = null);
    else if (/* @__PURE__ */ ne(h)) {
      const R = t;
      L(h, R.k) && (h.value = null), R.k && (a[R.k] = null);
    }
  }
  if (M(c))
    It(c, l, 12, [o, a]);
  else {
    const R = Q(c), k = /* @__PURE__ */ ne(c);
    if (R || k) {
      const H = () => {
        if (e.f) {
          const I = R ? E(c) ? p[c] : a[c] : L() || !e.k ? c.value : a[e.k];
          if (r)
            P(I) && Ds(I, i);
          else if (P(I))
            I.includes(i) || I.push(i);
          else if (R)
            a[c] = [i], E(c) && (p[c] = a[c]);
          else {
            const V = [i];
            L(c, e.k) && (c.value = V), e.k && (a[e.k] = V);
          }
        } else R ? (a[c] = o, E(c) && (p[c] = o)) : k && (L(c, e.k) && (c.value = o), e.k && (a[e.k] = o));
      };
      if (o) {
        const I = () => {
          H(), kt.delete(e);
        };
        I.id = -1, kt.set(e, I), ce(I, s);
      } else
        _n(e), H();
    }
  }
}
function _n(e) {
  const t = kt.get(e);
  t && (t.flags |= 8, kt.delete(e));
}
ss().requestIdleCallback;
ss().cancelIdleCallback;
const wt = (e) => !!e.type.__asyncLoader, Er = (e) => e.type.__isKeepAlive;
function to(e, t) {
  Cr(e, "a", t);
}
function so(e, t) {
  Cr(e, "da", t);
}
function Cr(e, t, s = le) {
  const n = e.__wdc || (e.__wdc = () => {
    let r = s;
    for (; r; ) {
      if (r.isDeactivated)
        return;
      r = r.parent;
    }
    return e();
  });
  if (rs(t, n, s), s) {
    let r = s.parent;
    for (; r && r.parent; )
      Er(r.parent.vnode) && no(n, t, s, r), r = r.parent;
  }
}
function no(e, t, s, n) {
  const r = rs(
    t,
    e,
    n,
    !0
    /* prepend */
  );
  Rr(() => {
    Ds(n[t], r);
  }, s);
}
function rs(e, t, s = le, n = !1) {
  if (s) {
    const r = s[e] || (s[e] = []), i = t.__weh || (t.__weh = (...o) => {
      je();
      const l = Ft(s), c = me(t, s, e, o);
      return l(), He(), c;
    });
    return n ? r.unshift(i) : r.push(i), i;
  }
}
const Ve = (e) => (t, s = le) => {
  (!Pt || e === "sp") && rs(e, (...n) => t(...n), s);
}, ro = Ve("bm"), Tr = Ve("m"), io = Ve(
  "bu"
), oo = Ve("u"), Ar = Ve(
  "bum"
), Rr = Ve("um"), lo = Ve(
  "sp"
), co = Ve("rtg"), fo = Ve("rtc");
function uo(e, t = le) {
  rs("ec", e, t);
}
const ao = /* @__PURE__ */ Symbol.for("v-ndc"), As = (e) => e ? zr(e) ? Zs(e) : As(e.parent) : null, xt = (
  // Move PURE marker to new line to workaround compiler discarding it
  // due to type annotation
  /* @__PURE__ */ X(/* @__PURE__ */ Object.create(null), {
    $: (e) => e,
    $el: (e) => e.vnode.el,
    $data: (e) => e.data,
    $props: (e) => e.props,
    $attrs: (e) => e.attrs,
    $slots: (e) => e.slots,
    $refs: (e) => e.refs,
    $parent: (e) => As(e.parent),
    $root: (e) => As(e.root),
    $host: (e) => e.ce,
    $emit: (e) => e.emit,
    $options: (e) => Pr(e),
    $forceUpdate: (e) => e.f || (e.f = () => {
      Gs(e.update);
    }),
    $nextTick: (e) => e.n || (e.n = gr.bind(e.proxy)),
    $watch: (e) => Xi.bind(e)
  })
), ms = (e, t) => e !== q && !e.__isScriptSetup && j(e, t), ho = {
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
        if (ms(n, t))
          return o[t] = 1, n[t];
        if (r !== q && j(r, t))
          return o[t] = 2, r[t];
        if (j(i, t))
          return o[t] = 3, i[t];
        if (s !== q && j(s, t))
          return o[t] = 4, s[t];
        Rs && (o[t] = 0);
      }
    }
    const h = xt[t];
    let a, p;
    if (h)
      return t === "$attrs" && se(e.attrs, "get", ""), h(e);
    if (
      // css module (injected by vue-loader)
      (a = l.__cssModules) && (a = a[t])
    )
      return a;
    if (s !== q && j(s, t))
      return o[t] = 4, s[t];
    if (
      // global properties
      p = c.config.globalProperties, j(p, t)
    )
      return p[t];
  },
  set({ _: e }, t, s) {
    const { data: n, setupState: r, ctx: i } = e;
    return ms(r, t) ? (r[t] = s, !0) : n !== q && j(n, t) ? (n[t] = s, !0) : j(e.props, t) || t[0] === "$" && t.slice(1) in e ? !1 : (i[t] = s, !0);
  },
  has({
    _: { data: e, setupState: t, accessCache: s, ctx: n, appContext: r, props: i, type: o }
  }, l) {
    let c;
    return !!(s[l] || e !== q && l[0] !== "$" && j(e, l) || ms(t, l) || j(i, l) || j(n, l) || j(xt, l) || j(r.config.globalProperties, l) || (c = o.__cssModules) && c[l]);
  },
  defineProperty(e, t, s) {
    return s.get != null ? e._.accessCache[t] = 0 : j(s, "value") && this.set(e, t, s.value, null), Reflect.defineProperty(e, t, s);
  }
};
function mn(e) {
  return P(e) ? e.reduce(
    (t, s) => (t[s] = null, t),
    {}
  ) : e;
}
let Rs = !0;
function po(e) {
  const t = Pr(e), s = e.proxy, n = e.ctx;
  Rs = !1, t.beforeCreate && bn(t.beforeCreate, e, "bc");
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
    updated: L,
    activated: R,
    deactivated: k,
    beforeDestroy: H,
    beforeUnmount: I,
    destroyed: V,
    unmounted: T,
    render: J,
    renderTracked: D,
    renderTriggered: F,
    errorCaptured: de,
    serverPrefetch: Nt,
    // public API
    expose: Ye,
    inheritAttrs: ct,
    // assets
    components: Dt,
    directives: Lt,
    filters: ls
  } = t;
  if (h && go(h, n, null), o)
    for (const G in o) {
      const K = o[G];
      M(K) && (n[G] = K.bind(s));
    }
  if (r) {
    const G = r.call(s, s);
    B(G) && (e.data = /* @__PURE__ */ qs(G));
  }
  if (Rs = !0, i)
    for (const G in i) {
      const K = i[G], qe = M(K) ? K.bind(s, s) : M(K.get) ? K.get.bind(s, s) : Oe, jt = !M(K) && M(K.set) ? K.set.bind(s) : Oe, Je = Is({
        get: qe,
        set: jt
      });
      Object.defineProperty(n, G, {
        enumerable: !0,
        configurable: !0,
        get: () => Je.value,
        set: (be) => Je.value = be
      });
    }
  if (l)
    for (const G in l)
      Or(l[G], n, s, G);
  if (c) {
    const G = M(c) ? c.call(s) : c;
    Reflect.ownKeys(G).forEach((K) => {
      Gi(K, G[K]);
    });
  }
  a && bn(a, e, "c");
  function re(G, K) {
    P(K) ? K.forEach((qe) => G(qe.bind(s))) : K && G(K.bind(s));
  }
  if (re(ro, p), re(Tr, S), re(io, E), re(oo, L), re(to, R), re(so, k), re(uo, de), re(fo, D), re(co, F), re(Ar, I), re(Rr, T), re(lo, Nt), P(Ye))
    if (Ye.length) {
      const G = e.exposed || (e.exposed = {});
      Ye.forEach((K) => {
        Object.defineProperty(G, K, {
          get: () => s[K],
          set: (qe) => s[K] = qe,
          enumerable: !0
        });
      });
    } else e.exposed || (e.exposed = {});
  J && e.render === Oe && (e.render = J), ct != null && (e.inheritAttrs = ct), Dt && (e.components = Dt), Lt && (e.directives = Lt), Nt && Sr(e);
}
function go(e, t, s = Oe) {
  P(e) && (e = Os(e));
  for (const n in e) {
    const r = e[n];
    let i;
    B(r) ? "default" in r ? i = Bt(
      r.from || n,
      r.default,
      !0
    ) : i = Bt(r.from || n) : i = Bt(r), /* @__PURE__ */ ne(i) ? Object.defineProperty(t, n, {
      enumerable: !0,
      configurable: !0,
      get: () => i.value,
      set: (o) => i.value = o
    }) : t[n] = i;
  }
}
function bn(e, t, s) {
  me(
    P(e) ? e.map((n) => n.bind(t.proxy)) : e.bind(t.proxy),
    t,
    s
  );
}
function Or(e, t, s, n) {
  let r = n.includes(".") ? wr(s, n) : () => s[n];
  if (Q(e)) {
    const i = t[e];
    M(i) && gs(r, i);
  } else if (M(e))
    gs(r, e.bind(s));
  else if (B(e))
    if (P(e))
      e.forEach((i) => Or(i, t, s, n));
    else {
      const i = M(e.handler) ? e.handler.bind(s) : t[e.handler];
      M(i) && gs(r, i, e);
    }
}
function Pr(e) {
  const t = e.type, { mixins: s, extends: n } = t, {
    mixins: r,
    optionsCache: i,
    config: { optionMergeStrategies: o }
  } = e.appContext, l = i.get(t);
  let c;
  return l ? c = l : !r.length && !s && !n ? c = t : (c = {}, r.length && r.forEach(
    (h) => Gt(c, h, o, !0)
  ), Gt(c, t, o)), B(t) && i.set(t, c), c;
}
function Gt(e, t, s, n = !1) {
  const { mixins: r, extends: i } = t;
  i && Gt(e, i, s, !0), r && r.forEach(
    (o) => Gt(e, o, s, !0)
  );
  for (const o in t)
    if (!(n && o === "expose")) {
      const l = _o[o] || s && s[o];
      e[o] = l ? l(e[o], t[o]) : t[o];
    }
  return e;
}
const _o = {
  data: yn,
  props: vn,
  emits: vn,
  // objects
  methods: gt,
  computed: gt,
  // lifecycle
  beforeCreate: ie,
  created: ie,
  beforeMount: ie,
  mounted: ie,
  beforeUpdate: ie,
  updated: ie,
  beforeDestroy: ie,
  beforeUnmount: ie,
  destroyed: ie,
  unmounted: ie,
  activated: ie,
  deactivated: ie,
  errorCaptured: ie,
  serverPrefetch: ie,
  // assets
  components: gt,
  directives: gt,
  // watch
  watch: bo,
  // provide / inject
  provide: yn,
  inject: mo
};
function yn(e, t) {
  return t ? e ? function() {
    return X(
      M(e) ? e.call(this, this) : e,
      M(t) ? t.call(this, this) : t
    );
  } : t : e;
}
function mo(e, t) {
  return gt(Os(e), Os(t));
}
function Os(e) {
  if (P(e)) {
    const t = {};
    for (let s = 0; s < e.length; s++)
      t[e[s]] = e[s];
    return t;
  }
  return e;
}
function ie(e, t) {
  return e ? [...new Set([].concat(e, t))] : t;
}
function gt(e, t) {
  return e ? X(/* @__PURE__ */ Object.create(null), e, t) : t;
}
function vn(e, t) {
  return e ? P(e) && P(t) ? [.../* @__PURE__ */ new Set([...e, ...t])] : X(
    /* @__PURE__ */ Object.create(null),
    mn(e),
    mn(t ?? {})
  ) : t;
}
function bo(e, t) {
  if (!e) return t;
  if (!t) return e;
  const s = X(/* @__PURE__ */ Object.create(null), e);
  for (const n in t)
    s[n] = ie(e[n], t[n]);
  return s;
}
function Mr() {
  return {
    app: null,
    config: {
      isNativeTag: Bn,
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
let yo = 0;
function vo(e, t) {
  return function(n, r = null) {
    M(n) || (n = X({}, n)), r != null && !B(r) && (r = null);
    const i = Mr(), o = /* @__PURE__ */ new WeakSet(), l = [];
    let c = !1;
    const h = i.app = {
      _uid: yo++,
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
        return o.has(a) || (a && M(a.install) ? (o.add(a), a.install(h, ...p)) : M(a) && (o.add(a), a(h, ...p))), h;
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
          const E = h._ceVNode || Pe(n, r);
          return E.appContext = i, S === !0 ? S = "svg" : S === !1 && (S = void 0), e(E, a, S), c = !0, h._container = a, a.__vue_app__ = h, Zs(E.component);
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
        const p = ot;
        ot = h;
        try {
          return a();
        } finally {
          ot = p;
        }
      }
    };
    return h;
  };
}
let ot = null;
const wo = (e, t) => t === "modelValue" || t === "model-value" ? e.modelModifiers : e[`${t}Modifiers`] || e[`${ue(t)}Modifiers`] || e[`${pe(t)}Modifiers`];
function xo(e, t, ...s) {
  if (e.isUnmounted) return;
  const n = e.vnode.props || q;
  let r = s;
  const i = t.startsWith("update:"), o = i && wo(n, t.slice(7));
  o && (o.trim && (r = s.map((a) => Q(a) ? a.trim() : a)), o.number && (r = s.map(fi)));
  let l, c = n[l = fs(t)] || // also try camelCase event handler (#2249)
  n[l = fs(ue(t))];
  !c && i && (c = n[l = fs(pe(t))]), c && me(
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
const So = /* @__PURE__ */ new WeakMap();
function Ir(e, t, s = !1) {
  const n = s ? So : t.emitsCache, r = n.get(e);
  if (r !== void 0)
    return r;
  const i = e.emits;
  let o = {}, l = !1;
  if (!M(e)) {
    const c = (h) => {
      const a = Ir(h, t, !0);
      a && (l = !0, X(o, a));
    };
    !s && t.mixins.length && t.mixins.forEach(c), e.extends && c(e.extends), e.mixins && e.mixins.forEach(c);
  }
  return !i && !l ? (B(e) && n.set(e, null), null) : (P(i) ? i.forEach((c) => o[c] = null) : X(o, i), B(e) && n.set(e, o), o);
}
function is(e, t) {
  return !e || !Xt(t) ? !1 : (t = t.slice(2), t = t === "Once" ? t : t.replace(/Once$/, ""), j(e, t[0].toLowerCase() + t.slice(1)) || j(e, pe(t)) || j(e, t));
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
    ctx: L,
    inheritAttrs: R
  } = e, k = Jt(e);
  let H, I;
  try {
    if (s.shapeFlag & 4) {
      const T = r || n, J = T;
      H = Te(
        h.call(
          J,
          T,
          a,
          p,
          E,
          S,
          L
        )
      ), I = l;
    } else {
      const T = t;
      H = Te(
        T.length > 1 ? T(
          p,
          { attrs: l, slots: o, emit: c }
        ) : T(
          p,
          null
        )
      ), I = t.props ? l : Eo(l);
    }
  } catch (T) {
    Xe.length = 0, ns(T, e, 1), H = Pe(Ke);
  }
  let V = H;
  if (I && R !== !1) {
    const T = Object.keys(I), { shapeFlag: J } = V;
    T.length && J & 7 && (i && T.some(Zt) && (I = Co(
      I,
      i
    )), V = lt(V, I, !1, !0));
  }
  return s.dirs && (V = lt(V, null, !1, !0), V.dirs = V.dirs ? V.dirs.concat(s.dirs) : s.dirs), s.transition && zs(V, s.transition), H = V, Jt(k), H;
}
const Eo = (e) => {
  let t;
  for (const s in e)
    (s === "class" || s === "style" || Xt(s)) && ((t || (t = {}))[s] = e[s]);
  return t;
}, Co = (e, t) => {
  const s = {};
  for (const n in e)
    (!Zt(n) || !(n.slice(9) in t)) && (s[n] = e[n]);
  return s;
};
function To(e, t, s) {
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
        if (Fr(o, n, S) && !is(h, S))
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
    if (Fr(t, e, i) && !is(s, i))
      return !0;
  }
  return !1;
}
function Fr(e, t, s) {
  const n = e[s], r = t[s];
  return s === "style" && B(n) && B(r) ? !$s(n, r) : n !== r;
}
function Ao({ vnode: e, parent: t, suspense: s }, n) {
  for (; t; ) {
    const r = t.subTree;
    if (r.suspense && r.suspense.activeBranch === e && (r.suspense.vnode.el = r.el = n, e = r), r === e)
      (e = t.vnode).el = n, t = t.parent;
    else
      break;
  }
  s && s.activeBranch === e && (s.vnode.el = n);
}
const Nr = {}, Dr = () => Object.create(Nr), Lr = (e) => Object.getPrototypeOf(e) === Nr;
function Ro(e, t, s, n = !1) {
  const r = {}, i = Dr();
  e.propsDefaults = /* @__PURE__ */ Object.create(null), jr(e, t, r, i);
  for (const o in e.propsOptions[0])
    o in r || (r[o] = void 0);
  s ? e.props = n ? r : /* @__PURE__ */ Li(r) : e.type.props ? e.props = r : e.props = i, e.attrs = i;
}
function Oo(e, t, s, n) {
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
        if (is(e.emitsOptions, S))
          continue;
        const E = t[S];
        if (c)
          if (j(i, S))
            E !== i[S] && (i[S] = E, h = !0);
          else {
            const L = ue(S);
            r[L] = Ps(
              c,
              l,
              L,
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
    jr(e, t, r, i) && (h = !0);
    let a;
    for (const p in l)
      (!t || // for camelCase
      !j(t, p) && // it's possible the original props was passed in as kebab-case
      // and converted to camelCase (#955)
      ((a = pe(p)) === p || !j(t, a))) && (c ? s && // for camelCase
      (s[p] !== void 0 || // for kebab-case
      s[a] !== void 0) && (r[p] = Ps(
        c,
        l,
        p,
        void 0,
        e,
        !0
      )) : delete r[p]);
    if (i !== l)
      for (const p in i)
        (!t || !j(t, p)) && (delete i[p], h = !0);
  }
  h && Le(e.attrs, "set", "");
}
function jr(e, t, s, n) {
  const [r, i] = e.propsOptions;
  let o = !1, l;
  if (t)
    for (let c in t) {
      if (mt(c))
        continue;
      const h = t[c];
      let a;
      r && j(r, a = ue(c)) ? !i || !i.includes(a) ? s[a] = h : (l || (l = {}))[a] = h : is(e.emitsOptions, c) || (!(c in n) || h !== n[c]) && (n[c] = h, o = !0);
    }
  if (i) {
    const c = /* @__PURE__ */ $(s), h = l || q;
    for (let a = 0; a < i.length; a++) {
      const p = i[a];
      s[p] = Ps(
        r,
        c,
        p,
        h[p],
        e,
        !j(h, p)
      );
    }
  }
  return o;
}
function Ps(e, t, s, n, r, i) {
  const o = e[s];
  if (o != null) {
    const l = j(o, "default");
    if (l && n === void 0) {
      const c = o.default;
      if (o.type !== Function && !o.skipFactory && M(c)) {
        const { propsDefaults: h } = r;
        if (s in h)
          n = h[s];
        else {
          const a = Ft(r);
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
const Po = /* @__PURE__ */ new WeakMap();
function Hr(e, t, s = !1) {
  const n = s ? Po : t.propsCache, r = n.get(e);
  if (r)
    return r;
  const i = e.props, o = {}, l = [];
  let c = !1;
  if (!M(e)) {
    const a = (p) => {
      c = !0;
      const [S, E] = Hr(p, t, !0);
      X(o, S), E && l.push(...E);
    };
    !s && t.mixins.length && t.mixins.forEach(a), e.extends && a(e.extends), e.mixins && e.mixins.forEach(a);
  }
  if (!i && !c)
    return B(e) && n.set(e, st), st;
  if (P(i))
    for (let a = 0; a < i.length; a++) {
      const p = ue(i[a]);
      Sn(p) && (o[p] = q);
    }
  else if (i)
    for (const a in i) {
      const p = ue(a);
      if (Sn(p)) {
        const S = i[a], E = o[p] = P(S) || M(S) ? { type: S } : X({}, S), L = E.type;
        let R = !1, k = !0;
        if (P(L))
          for (let H = 0; H < L.length; ++H) {
            const I = L[H], V = M(I) && I.name;
            if (V === "Boolean") {
              R = !0;
              break;
            } else V === "String" && (k = !1);
          }
        else
          R = M(L) && L.name === "Boolean";
        E[
          0
          /* shouldCast */
        ] = R, E[
          1
          /* shouldCastTrue */
        ] = k, (R || j(E, "default")) && l.push(p);
      }
    }
  const h = [o, l];
  return B(e) && n.set(e, h), h;
}
function Sn(e) {
  return e[0] !== "$" && !mt(e);
}
const Qs = (e) => e === "_" || e === "_ctx" || e === "$stable", Xs = (e) => P(e) ? e.map(Te) : [Te(e)], Mo = (e, t, s) => {
  if (t._n)
    return t;
  const n = ki((...r) => Xs(t(...r)), s);
  return n._c = !1, n;
}, $r = (e, t, s) => {
  const n = e._ctx;
  for (const r in e) {
    if (Qs(r)) continue;
    const i = e[r];
    if (M(i))
      t[r] = Mo(r, i, n);
    else if (i != null) {
      const o = Xs(i);
      t[r] = () => o;
    }
  }
}, Vr = (e, t) => {
  const s = Xs(t);
  e.slots.default = () => s;
}, Ur = (e, t, s) => {
  for (const n in t)
    (s || !Qs(n)) && (e[n] = t[n]);
}, Io = (e, t, s) => {
  const n = e.slots = Dr();
  if (e.vnode.shapeFlag & 32) {
    const r = t._;
    r ? (Ur(n, t, s), s && kn(n, "_", r, !0)) : $r(t, n);
  } else t && Vr(e, t);
}, Fo = (e, t, s) => {
  const { vnode: n, slots: r } = e;
  let i = !0, o = q;
  if (n.shapeFlag & 32) {
    const l = t._;
    l ? s && l === 1 ? i = !1 : Ur(r, t, s) : (i = !t.$stable, $r(t, r)), o = t;
  } else t && (Vr(e, t), o = { default: 1 });
  if (i)
    for (const l in r)
      !Qs(l) && o[l] == null && delete r[l];
}, ce = Ho;
function No(e) {
  return Do(e);
}
function Do(e, t) {
  const s = ss();
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
    setScopeId: E = Oe,
    insertStaticContent: L
  } = e, R = (f, u, d, b = null, m = null, g = null, w = void 0, v = null, y = !!u.dynamicChildren) => {
    if (f === u)
      return;
    f && !pt(f, u) && (b = Ht(f), be(f, m, g, !0), f = null), u.patchFlag === -2 && (y = !1, u.dynamicChildren = null);
    const { type: _, ref: A, shapeFlag: x } = u;
    switch (_) {
      case os:
        k(f, u, d, b);
        break;
      case Ke:
        H(f, u, d, b);
        break;
      case ys:
        f == null && I(u, d, b, w);
        break;
      case Ce:
        Dt(
          f,
          u,
          d,
          b,
          m,
          g,
          w,
          v,
          y
        );
        break;
      default:
        x & 1 ? J(
          f,
          u,
          d,
          b,
          m,
          g,
          w,
          v,
          y
        ) : x & 6 ? Lt(
          f,
          u,
          d,
          b,
          m,
          g,
          w,
          v,
          y
        ) : (x & 64 || x & 128) && _.process(
          f,
          u,
          d,
          b,
          m,
          g,
          w,
          v,
          y,
          ut
        );
    }
    A != null && m ? vt(A, f && f.ref, g, u || f, !u) : A == null && f && f.ref != null && vt(f.ref, null, g, f, !0);
  }, k = (f, u, d, b) => {
    if (f == null)
      n(
        u.el = l(u.children),
        d,
        b
      );
    else {
      const m = u.el = f.el;
      u.children !== f.children && h(m, u.children);
    }
  }, H = (f, u, d, b) => {
    f == null ? n(
      u.el = c(u.children || ""),
      d,
      b
    ) : u.el = f.el;
  }, I = (f, u, d, b) => {
    [f.el, f.anchor] = L(
      f.children,
      u,
      d,
      b,
      f.el,
      f.anchor
    );
  }, V = ({ el: f, anchor: u }, d, b) => {
    let m;
    for (; f && f !== u; )
      m = S(f), n(f, d, b), f = m;
    n(u, d, b);
  }, T = ({ el: f, anchor: u }) => {
    let d;
    for (; f && f !== u; )
      d = S(f), r(f), f = d;
    r(u);
  }, J = (f, u, d, b, m, g, w, v, y) => {
    if (u.type === "svg" ? w = "svg" : u.type === "math" && (w = "mathml"), f == null)
      D(
        u,
        d,
        b,
        m,
        g,
        w,
        v,
        y
      );
    else {
      const _ = f.el && f.el._isVueCE ? f.el : null;
      try {
        _ && _._beginPatch(), Nt(
          f,
          u,
          m,
          g,
          w,
          v,
          y
        );
      } finally {
        _ && _._endPatch();
      }
    }
  }, D = (f, u, d, b, m, g, w, v) => {
    let y, _;
    const { props: A, shapeFlag: x, transition: C, dirs: O } = f;
    if (y = f.el = o(
      f.type,
      g,
      A && A.is,
      A
    ), x & 8 ? a(y, f.children) : x & 16 && de(
      f.children,
      y,
      null,
      b,
      m,
      bs(f, g),
      w,
      v
    ), O && ke(f, null, b, "created"), F(y, f, f.scopeId, w, b), A) {
      for (const W in A)
        W !== "value" && !mt(W) && i(y, W, null, A[W], g, b);
      "value" in A && i(y, "value", null, A.value, g), (_ = A.onVnodeBeforeMount) && xe(_, b, f);
    }
    O && ke(f, null, b, "beforeMount");
    const N = Lo(m, C);
    N && C.beforeEnter(y), n(y, u, d), ((_ = A && A.onVnodeMounted) || N || O) && ce(() => {
      try {
        _ && xe(_, b, f), N && C.enter(y), O && ke(f, null, b, "mounted");
      } finally {
      }
    }, m);
  }, F = (f, u, d, b, m) => {
    if (d && E(f, d), b)
      for (let g = 0; g < b.length; g++)
        E(f, b[g]);
    if (m) {
      let g = m.subTree;
      if (u === g || Yr(g.type) && (g.ssContent === u || g.ssFallback === u)) {
        const w = m.vnode;
        F(
          f,
          w,
          w.scopeId,
          w.slotScopeIds,
          m.parent
        );
      }
    }
  }, de = (f, u, d, b, m, g, w, v, y = 0) => {
    for (let _ = y; _ < f.length; _++) {
      const A = f[_] = v ? De(f[_]) : Te(f[_]);
      R(
        null,
        A,
        u,
        d,
        b,
        m,
        g,
        w,
        v
      );
    }
  }, Nt = (f, u, d, b, m, g, w) => {
    const v = u.el = f.el;
    let { patchFlag: y, dynamicChildren: _, dirs: A } = u;
    y |= f.patchFlag & 16;
    const x = f.props || q, C = u.props || q;
    let O;
    if (d && Ge(d, !1), (O = C.onVnodeBeforeUpdate) && xe(O, d, u, f), A && ke(u, f, d, "beforeUpdate"), d && Ge(d, !0), // #6385 the old vnode may be a user-wrapped non-isomorphic block
    // Force full diff when block metadata is unstable.
    _ && (!f.dynamicChildren || f.dynamicChildren.length !== _.length) && (y = 0, w = !1, _ = null), (x.innerHTML && C.innerHTML == null || x.textContent && C.textContent == null) && a(v, ""), _ ? Ye(
      f.dynamicChildren,
      _,
      v,
      d,
      b,
      bs(u, m),
      g
    ) : w || K(
      f,
      u,
      v,
      null,
      d,
      b,
      bs(u, m),
      g,
      !1
    ), y > 0) {
      if (y & 16)
        ct(v, x, C, d, m);
      else if (y & 2 && x.class !== C.class && i(v, "class", null, C.class, m), y & 4 && i(v, "style", x.style, C.style, m), y & 8) {
        const N = u.dynamicProps;
        for (let W = 0; W < N.length; W++) {
          const U = N[W], Z = x[U], ee = C[U];
          (ee !== Z || U === "value") && i(v, U, Z, ee, m, d);
        }
      }
      y & 1 && f.children !== u.children && a(v, u.children);
    } else !w && _ == null && ct(v, x, C, d, m);
    ((O = C.onVnodeUpdated) || A) && ce(() => {
      O && xe(O, d, u, f), A && ke(u, f, d, "updated");
    }, b);
  }, Ye = (f, u, d, b, m, g, w) => {
    for (let v = 0; v < u.length; v++) {
      const y = f[v], _ = u[v], A = (
        // oldVNode may be an errored async setup() component inside Suspense
        // which will not have a mounted element
        y.el && // - In the case of a Fragment, we need to provide the actual parent
        // of the Fragment itself so it can move its children.
        (y.type === Ce || // - In the case of different nodes, there is going to be a replacement
        // which also requires the correct parent container
        !pt(y, _) || // - In the case of a component, it could contain anything.
        y.shapeFlag & 198) ? p(y.el) : (
          // In other cases, the parent container is not actually used so we
          // just pass the block element here to avoid a DOM parentNode call.
          d
        )
      );
      R(
        y,
        _,
        A,
        null,
        b,
        m,
        g,
        w,
        !0
      );
    }
  }, ct = (f, u, d, b, m) => {
    if (u !== d) {
      if (u !== q)
        for (const g in u)
          !mt(g) && !(g in d) && i(
            f,
            g,
            u[g],
            null,
            m,
            b
          );
      for (const g in d) {
        if (mt(g)) continue;
        const w = d[g], v = u[g];
        w !== v && g !== "value" && i(f, g, v, w, m, b);
      }
      "value" in d && i(f, "value", u.value, d.value, m);
    }
  }, Dt = (f, u, d, b, m, g, w, v, y) => {
    const _ = u.el = f ? f.el : l(""), A = u.anchor = f ? f.anchor : l("");
    let { patchFlag: x, dynamicChildren: C, slotScopeIds: O } = u;
    O && (v = v ? v.concat(O) : O), f == null ? (n(_, d, b), n(A, d, b), de(
      // #10007
      // such fragment like `<></>` will be compiled into
      // a fragment which doesn't have a children.
      // In this case fallback to an empty array
      u.children || [],
      d,
      A,
      m,
      g,
      w,
      v,
      y
    )) : x > 0 && x & 64 && C && // #2715 the previous fragment could've been a BAILed one as a result
    // of renderSlot() with no valid children
    f.dynamicChildren && f.dynamicChildren.length === C.length ? (Ye(
      f.dynamicChildren,
      C,
      d,
      m,
      g,
      w,
      v
    ), // #2080 if the stable fragment has a key, it's a <template v-for> that may
    //  get moved around. Make sure all root level vnodes inherit el.
    // #2134 or if it's a component root, it may also get moved around
    // as the component is being moved.
    (u.key != null || m && u === m.subTree) && Wr(
      f,
      u,
      !0
      /* shallow */
    )) : K(
      f,
      u,
      d,
      A,
      m,
      g,
      w,
      v,
      y
    );
  }, Lt = (f, u, d, b, m, g, w, v, y) => {
    u.slotScopeIds = v, f == null ? u.shapeFlag & 512 ? m.ctx.activate(
      u,
      d,
      b,
      w,
      y
    ) : ls(
      u,
      d,
      b,
      m,
      g,
      w,
      y
    ) : sn(f, u, y);
  }, ls = (f, u, d, b, m, g, w) => {
    const v = f.component = Jo(
      f,
      b,
      m
    );
    if (Er(f) && (v.ctx.renderer = ut), Go(v, !1, w), v.asyncDep) {
      if (m && m.registerDep(v, re, w), !f.el) {
        const y = v.subTree = Pe(Ke);
        H(null, y, u, d), f.placeholder = y.el;
      }
    } else
      re(
        v,
        f,
        u,
        d,
        m,
        g,
        w
      );
  }, sn = (f, u, d) => {
    const b = u.component = f.component;
    if (To(f, u, d))
      if (b.asyncDep && !b.asyncResolved) {
        G(b, u, d);
        return;
      } else
        b.next = u, b.update();
    else
      u.el = f.el, b.vnode = u;
  }, re = (f, u, d, b, m, g, w) => {
    const v = () => {
      if (f.isMounted) {
        let { next: x, bu: C, u: O, parent: N, vnode: W } = f;
        {
          const ve = Br(f);
          if (ve) {
            x && (x.el = W.el, G(f, x, w)), ve.asyncDep.then(() => {
              ce(() => {
                f.isUnmounted || _();
              }, m);
            });
            return;
          }
        }
        let U = x, Z;
        Ge(f, !1), x ? (x.el = W.el, G(f, x, w)) : x = W, C && us(C), (Z = x.props && x.props.onVnodeBeforeUpdate) && xe(Z, N, x, W), Ge(f, !0);
        const ee = wn(f), ye = f.subTree;
        f.subTree = ee, R(
          ye,
          ee,
          // parent may have changed if it's in a teleport
          p(ye.el),
          // anchor may have changed if it's in a fragment
          Ht(ye),
          f,
          m,
          g
        ), x.el = ee.el, U === null && Ao(f, ee.el), O && ce(O, m), (Z = x.props && x.props.onVnodeUpdated) && ce(
          () => xe(Z, N, x, W),
          m
        );
      } else {
        let x;
        const { el: C, props: O } = u, { bm: N, m: W, parent: U, root: Z, type: ee } = f, ye = wt(u);
        Ge(f, !1), N && us(N), !ye && (x = O && O.onVnodeBeforeMount) && xe(x, U, u), Ge(f, !0);
        {
          Z.ce && Z.ce._hasShadowRoot() && Z.ce._injectChildStyle(
            ee,
            f.parent ? f.parent.type : void 0
          );
          const ve = f.subTree = wn(f);
          R(
            null,
            ve,
            d,
            b,
            f,
            m,
            g
          ), u.el = ve.el;
        }
        if (W && ce(W, m), !ye && (x = O && O.onVnodeMounted)) {
          const ve = u;
          ce(
            () => xe(x, U, ve),
            m
          );
        }
        (u.shapeFlag & 256 || U && wt(U.vnode) && U.vnode.shapeFlag & 256) && f.a && ce(f.a, m), f.isMounted = !0, u = d = b = null;
      }
    };
    f.scope.on();
    const y = f.effect = new Xn(v);
    f.scope.off();
    const _ = f.update = y.run.bind(y), A = f.job = y.runIfDirty.bind(y);
    A.i = f, A.id = f.uid, y.scheduler = () => Gs(A), Ge(f, !0), _();
  }, G = (f, u, d) => {
    u.component = f;
    const b = f.vnode.props;
    f.vnode = u, f.next = null, Oo(f, u.props, b, d), Fo(f, u.children, d), je(), pn(f), He();
  }, K = (f, u, d, b, m, g, w, v, y = !1) => {
    const _ = f && f.children, A = f ? f.shapeFlag : 0, x = u.children, { patchFlag: C, shapeFlag: O } = u;
    if (C > 0) {
      if (C & 128) {
        jt(
          _,
          x,
          d,
          b,
          m,
          g,
          w,
          v,
          y
        );
        return;
      } else if (C & 256) {
        qe(
          _,
          x,
          d,
          b,
          m,
          g,
          w,
          v,
          y
        );
        return;
      }
    }
    O & 8 ? (A & 16 && ft(_, m, g), x !== _ && a(d, x)) : A & 16 ? O & 16 ? jt(
      _,
      x,
      d,
      b,
      m,
      g,
      w,
      v,
      y
    ) : ft(_, m, g, !0) : (A & 8 && a(d, ""), O & 16 && de(
      x,
      d,
      b,
      m,
      g,
      w,
      v,
      y
    ));
  }, qe = (f, u, d, b, m, g, w, v, y) => {
    f = f || st, u = u || st;
    const _ = f.length, A = u.length, x = Math.min(_, A);
    let C;
    for (C = 0; C < x; C++) {
      const O = u[C] = y ? De(u[C]) : Te(u[C]);
      R(
        f[C],
        O,
        d,
        null,
        m,
        g,
        w,
        v,
        y
      );
    }
    _ > A ? ft(
      f,
      m,
      g,
      !0,
      !1,
      x
    ) : de(
      u,
      d,
      b,
      m,
      g,
      w,
      v,
      y,
      x
    );
  }, jt = (f, u, d, b, m, g, w, v, y) => {
    let _ = 0;
    const A = u.length;
    let x = f.length - 1, C = A - 1;
    for (; _ <= x && _ <= C; ) {
      const O = f[_], N = u[_] = y ? De(u[_]) : Te(u[_]);
      if (pt(O, N))
        R(
          O,
          N,
          d,
          null,
          m,
          g,
          w,
          v,
          y
        );
      else
        break;
      _++;
    }
    for (; _ <= x && _ <= C; ) {
      const O = f[x], N = u[C] = y ? De(u[C]) : Te(u[C]);
      if (pt(O, N))
        R(
          O,
          N,
          d,
          null,
          m,
          g,
          w,
          v,
          y
        );
      else
        break;
      x--, C--;
    }
    if (_ > x) {
      if (_ <= C) {
        const O = C + 1, N = O < A ? u[O].el : b;
        for (; _ <= C; )
          R(
            null,
            u[_] = y ? De(u[_]) : Te(u[_]),
            d,
            N,
            m,
            g,
            w,
            v,
            y
          ), _++;
      }
    } else if (_ > C)
      for (; _ <= x; )
        be(f[_], m, g, !0), _++;
    else {
      const O = _, N = _, W = /* @__PURE__ */ new Map();
      for (_ = N; _ <= C; _++) {
        const ae = u[_] = y ? De(u[_]) : Te(u[_]);
        ae.key != null && W.set(ae.key, _);
      }
      let U, Z = 0;
      const ee = C - N + 1;
      let ye = !1, ve = 0;
      const at = new Array(ee);
      for (_ = 0; _ < ee; _++) at[_] = 0;
      for (_ = O; _ <= x; _++) {
        const ae = f[_];
        if (Z >= ee) {
          be(ae, m, g, !0);
          continue;
        }
        let we;
        if (ae.key != null)
          we = W.get(ae.key);
        else
          for (U = N; U <= C; U++)
            if (at[U - N] === 0 && pt(ae, u[U])) {
              we = U;
              break;
            }
        we === void 0 ? be(ae, m, g, !0) : (at[we - N] = _ + 1, we >= ve ? ve = we : ye = !0, R(
          ae,
          u[we],
          d,
          null,
          m,
          g,
          w,
          v,
          y
        ), Z++);
      }
      const on = ye ? jo(at) : st;
      for (U = on.length - 1, _ = ee - 1; _ >= 0; _--) {
        const ae = N + _, we = u[ae], ln = u[ae + 1], cn = ae + 1 < A ? (
          // #13559, #14173 fallback to el placeholder for unresolved async component
          ln.el || Kr(ln)
        ) : b;
        at[_] === 0 ? R(
          null,
          we,
          d,
          cn,
          m,
          g,
          w,
          v,
          y
        ) : ye && (U < 0 || _ !== on[U] ? Je(we, d, cn, 2) : U--);
      }
    }
  }, Je = (f, u, d, b, m = null) => {
    const { el: g, type: w, transition: v, children: y, shapeFlag: _ } = f;
    if (_ & 6) {
      Je(f.component.subTree, u, d, b);
      return;
    }
    if (_ & 128) {
      f.suspense.move(u, d, b);
      return;
    }
    if (_ & 64) {
      w.move(f, u, d, ut);
      return;
    }
    if (w === Ce) {
      n(g, u, d);
      for (let x = 0; x < y.length; x++)
        Je(y[x], u, d, b);
      n(f.anchor, u, d);
      return;
    }
    if (w === ys) {
      V(f, u, d);
      return;
    }
    if (b !== 2 && _ & 1 && v)
      if (b === 0)
        v.persisted && !g[_s] ? n(g, u, d) : (v.beforeEnter(g), n(g, u, d), ce(() => v.enter(g), m));
      else {
        const { leave: x, delayLeave: C, afterLeave: O } = v, N = () => {
          f.ctx.isUnmounted ? r(g) : n(g, u, d);
        }, W = () => {
          const U = g._isLeaving || !!g[_s];
          g._isLeaving && g[_s](
            !0
            /* cancelled */
          ), v.persisted && !U ? N() : x(g, () => {
            N(), O && O();
          });
        };
        C ? C(g, N, W) : W();
      }
    else
      n(g, u, d);
  }, be = (f, u, d, b = !1, m = !1) => {
    const {
      type: g,
      props: w,
      ref: v,
      children: y,
      dynamicChildren: _,
      shapeFlag: A,
      patchFlag: x,
      dirs: C,
      cacheIndex: O,
      memo: N
    } = f;
    if (x === -2 && (m = !1), v != null && (je(), vt(v, null, d, f, !0), He()), O != null && (u.renderCache[O] = void 0), A & 256) {
      u.ctx.deactivate(f);
      return;
    }
    const W = A & 1 && C, U = !wt(f);
    let Z;
    if (U && (Z = w && w.onVnodeBeforeUnmount) && xe(Z, u, f), A & 6)
      ri(f.component, d, b);
    else {
      if (A & 128) {
        f.suspense.unmount(d, b);
        return;
      }
      W && ke(f, null, u, "beforeUnmount"), A & 64 ? f.type.remove(
        f,
        u,
        d,
        ut,
        b
      ) : _ && // #5154
      // when v-once is used inside a block, setBlockTracking(-1) marks the
      // parent block with hasOnce: true
      // so that it doesn't take the fast path during unmount - otherwise
      // components nested in v-once are never unmounted.
      !_.hasOnce && // #1153: fast path should not be taken for non-stable (v-for) fragments
      (g !== Ce || x > 0 && x & 64) ? ft(
        _,
        u,
        d,
        !1,
        !0
      ) : (g === Ce && x & 384 || !m && A & 16) && ft(y, u, d), b && nn(f);
    }
    const ee = N != null && O == null;
    (U && (Z = w && w.onVnodeUnmounted) || W || ee) && ce(() => {
      Z && xe(Z, u, f), W && ke(f, null, u, "unmounted"), ee && (f.el = null);
    }, d);
  }, nn = (f) => {
    const { type: u, el: d, anchor: b, transition: m } = f;
    if (u === Ce) {
      ni(d, b);
      return;
    }
    if (u === ys) {
      T(f);
      return;
    }
    const g = () => {
      r(d), m && !m.persisted && m.afterLeave && m.afterLeave();
    };
    if (f.shapeFlag & 1 && m && !m.persisted) {
      const { leave: w, delayLeave: v } = m, y = () => w(d, g);
      v ? v(f.el, g, y) : y();
    } else
      g();
  }, ni = (f, u) => {
    let d;
    for (; f !== u; )
      d = S(f), r(f), f = d;
    r(u);
  }, ri = (f, u, d) => {
    const { bum: b, scope: m, job: g, subTree: w, um: v, m: y, a: _ } = f;
    En(y), En(_), b && us(b), m.stop(), g && (g.flags |= 8, be(w, f, u, d)), v && ce(v, u), ce(() => {
      f.isUnmounted = !0;
    }, u);
  }, ft = (f, u, d, b = !1, m = !1, g = 0) => {
    for (let w = g; w < f.length; w++)
      be(f[w], u, d, b, m);
  }, Ht = (f) => {
    if (f.shapeFlag & 6)
      return Ht(f.component.subTree);
    if (f.shapeFlag & 128)
      return f.suspense.next();
    const u = S(f.anchor || f.el), d = u && u[Zi];
    return d ? S(d) : u;
  };
  let cs = !1;
  const rn = (f, u, d) => {
    let b;
    f == null ? u._vnode && (be(u._vnode, null, null, !0), b = u._vnode.component) : R(
      u._vnode || null,
      f,
      u,
      null,
      null,
      null,
      d
    ), u._vnode = f, cs || (cs = !0, pn(b), mr(), cs = !1);
  }, ut = {
    p: R,
    um: be,
    m: Je,
    r: nn,
    mt: ls,
    mc: de,
    pc: K,
    pbc: Ye,
    n: Ht,
    o: e
  };
  return {
    render: rn,
    hydrate: void 0,
    createApp: vo(rn)
  };
}
function bs({ type: e, props: t }, s) {
  return s === "svg" && e === "foreignObject" || s === "mathml" && e === "annotation-xml" && t && t.encoding && t.encoding.includes("html") ? void 0 : s;
}
function Ge({ effect: e, job: t }, s) {
  s ? (e.flags |= 32, t.flags |= 4) : (e.flags &= -33, t.flags &= -5);
}
function Lo(e, t) {
  return (!e || e && !e.pendingBranch) && t && !t.persisted;
}
function Wr(e, t, s = !1) {
  const n = e.children, r = t.children;
  if (P(n) && P(r))
    for (let i = 0; i < n.length; i++) {
      const o = n[i];
      let l = r[i];
      l.shapeFlag & 1 && !l.dynamicChildren && ((l.patchFlag <= 0 || l.patchFlag === 32) && (l = r[i] = De(r[i]), l.el = o.el), !s && l.patchFlag !== -2 && Wr(o, l)), l.type === os && (l.patchFlag === -1 && (l = r[i] = De(l)), l.el = o.el), l.type === Ke && !l.el && (l.el = o.el);
    }
}
function jo(e) {
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
function Br(e) {
  const t = e.subTree.component;
  if (t)
    return t.asyncDep && !t.asyncResolved ? t : Br(t);
}
function En(e) {
  if (e)
    for (let t = 0; t < e.length; t++)
      e[t].flags |= 8;
}
function Kr(e) {
  if (e.placeholder)
    return e.placeholder;
  const t = e.component;
  return t ? Kr(t.subTree) : null;
}
const Yr = (e) => e.__isSuspense;
function Ho(e, t) {
  t && t.pendingBranch ? P(e) ? t.effects.push(...e) : t.effects.push(e) : Ji(e);
}
const Ce = /* @__PURE__ */ Symbol.for("v-fgt"), os = /* @__PURE__ */ Symbol.for("v-txt"), Ke = /* @__PURE__ */ Symbol.for("v-cmt"), ys = /* @__PURE__ */ Symbol.for("v-stc"), Xe = [];
let he = null;
function tt(e = !1) {
  Xe.push(he = e ? null : []);
}
function qr() {
  Xe.pop(), he = Xe[Xe.length - 1] || null;
}
let Ot = 1;
function Cn(e, t = !1) {
  Ot += e, e < 0 && he && t && (he.hasOnce = !0);
}
function Jr(e) {
  return e.dynamicChildren = Ot > 0 ? he || st : null, qr(), Ot > 0 && he && he.push(e), e;
}
function dt(e, t, s, n, r, i) {
  return Jr(
    z(
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
function $o(e, t, s, n, r) {
  return Jr(
    Pe(
      e,
      t,
      s,
      n,
      r,
      !0
    )
  );
}
function kr(e) {
  return e ? e.__v_isVNode === !0 : !1;
}
function pt(e, t) {
  return e.type === t.type && e.key === t.key;
}
const Gr = ({ key: e }) => e ?? null, Kt = ({
  ref: e,
  ref_key: t,
  ref_for: s
}) => (typeof e == "number" && (e = "" + e), e != null ? Q(e) || /* @__PURE__ */ ne(e) || M(e) ? { i: Re, r: e, k: t, f: !!s } : e : null);
function z(e, t = null, s = null, n = 0, r = null, i = e === Ce ? 0 : 1, o = !1, l = !1) {
  const c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e,
    props: t,
    key: t && Gr(t),
    ref: t && Kt(t),
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
    ctx: Re
  };
  return l ? (zt(c, s), i & 128 && e.normalize(c)) : s && (c.shapeFlag |= Q(s) ? 8 : 16), Ot > 0 && // avoid a block node from tracking itself
  !o && // has current parent block
  he && // presence of a patch flag indicates this node needs patching on updates.
  // component nodes also should always be patched, because even if the
  // component doesn't need to update, it needs to persist the instance on to
  // the next vnode so that it can be properly unmounted later.
  (c.patchFlag > 0 || i & 6) && // the EVENTS flag is only for hydration and if it is the only flag, the
  // vnode should not be considered dynamic due to handler caching.
  c.patchFlag !== 32 && he.push(c), c;
}
const Pe = Vo;
function Vo(e, t = null, s = null, n = 0, r = null, i = !1) {
  if ((!e || e === ao) && (e = Ke), kr(e)) {
    const l = lt(
      e,
      t,
      !0
      /* mergeRef: true */
    );
    return s && zt(l, s), Ot > 0 && !i && he && (l.shapeFlag & 6 ? he[he.indexOf(e)] = l : he.push(l)), l.patchFlag = -2, l;
  }
  if (Zo(e) && (e = e.__vccOpts), t) {
    t = Uo(t);
    let { class: l, style: c } = t;
    l && !Q(l) && (t.class = Hs(l)), B(c) && (/* @__PURE__ */ ks(c) && !P(c) && (c = X({}, c)), t.style = js(c));
  }
  const o = Q(e) ? 1 : Yr(e) ? 128 : eo(e) ? 64 : B(e) ? 4 : M(e) ? 2 : 0;
  return z(
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
function Uo(e) {
  return e ? /* @__PURE__ */ ks(e) || Lr(e) ? X({}, e) : e : null;
}
function lt(e, t, s = !1, n = !1) {
  const { props: r, ref: i, patchFlag: o, children: l, transition: c } = e, h = t ? Ko(r || {}, t) : r, a = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: e.type,
    props: h,
    key: h && Gr(h),
    ref: t && t.ref ? (
      // #2078 in the case of <component :is="vnode" ref="extra"/>
      // if the vnode itself already has a ref, cloneVNode will need to merge
      // the refs so the single vnode can be set on multiple refs
      s && i ? P(i) ? i.concat(Kt(t)) : [i, Kt(t)] : Kt(t)
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
    patchFlag: t && e.type !== Ce ? o === -1 ? 16 : o | 16 : o,
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
    ssContent: e.ssContent && lt(e.ssContent),
    ssFallback: e.ssFallback && lt(e.ssFallback),
    placeholder: e.placeholder,
    el: e.el,
    anchor: e.anchor,
    ctx: e.ctx,
    ce: e.ce
  };
  return c && n && zs(
    a,
    c.clone(a)
  ), a;
}
function Wo(e = " ", t = 0) {
  return Pe(os, null, e, t);
}
function Bo(e = "", t = !1) {
  return t ? (tt(), $o(Ke, null, e)) : Pe(Ke, null, e);
}
function Te(e) {
  return e == null || typeof e == "boolean" ? Pe(Ke) : P(e) ? Pe(
    Ce,
    null,
    // #3666, avoid reference pollution when reusing vnode
    e.slice()
  ) : kr(e) ? De(e) : Pe(os, null, String(e));
}
function De(e) {
  return e.el === null && e.patchFlag !== -1 || e.memo ? e : lt(e);
}
function zt(e, t) {
  let s = 0;
  const { shapeFlag: n } = e;
  if (t == null)
    t = null;
  else if (P(t))
    s = 16;
  else if (typeof t == "object")
    if (n & 65) {
      const r = t.default;
      r && (r._c && (r._d = !1), zt(e, r()), r._c && (r._d = !0));
      return;
    } else {
      s = 32;
      const r = t._;
      !r && !Lr(t) ? t._ctx = Re : r === 3 && Re && (Re.slots._ === 1 ? t._ = 1 : (t._ = 2, e.patchFlag |= 1024));
    }
  else if (M(t)) {
    if (n & 65) {
      zt(e, { default: t });
      return;
    }
    t = { default: t, _ctx: Re }, s = 32;
  } else
    t = String(t), n & 64 ? (s = 16, t = [Wo(t)]) : s = 8;
  e.children = t, e.shapeFlag |= s;
}
function Ko(...e) {
  const t = {};
  for (let s = 0; s < e.length; s++) {
    const n = e[s];
    for (const r in n)
      if (r === "class")
        t.class !== n.class && (t.class = Hs([t.class, n.class]));
      else if (r === "style")
        t.style = js([t.style, n.style]);
      else if (Xt(r)) {
        const i = t[r], o = n[r];
        o && i !== o && !(P(i) && i.includes(o)) ? t[r] = i ? [].concat(i, o) : o : o == null && i == null && // mergeProps({ 'onUpdate:modelValue': undefined }) should not retain
        // the model listener.
        !Zt(r) && (t[r] = o);
      } else r !== "" && (t[r] = n[r]);
  }
  return t;
}
function xe(e, t, s, n = null) {
  me(e, t, 7, [
    s,
    n
  ]);
}
const Yo = Mr();
let qo = 0;
function Jo(e, t, s) {
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
    scope: new mi(
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
    propsOptions: Hr(n, r),
    emitsOptions: Ir(n, r),
    // emit
    emit: null,
    // to be set immediately
    emitted: null,
    // props default value
    propsDefaults: q,
    // inheritAttrs
    inheritAttrs: n.inheritAttrs,
    // state
    ctx: q,
    data: q,
    props: q,
    attrs: q,
    slots: q,
    refs: q,
    setupState: q,
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
  return i.ctx = { _: i }, i.root = t ? t.root : i, i.emit = xo.bind(null, i), e.ce && e.ce(i), i;
}
let le = null;
const ko = () => le || Re;
let Qt, Ms;
{
  const e = ss(), t = (s, n) => {
    let r;
    return (r = e[s]) || (r = e[s] = []), r.push(n), (i) => {
      r.length > 1 ? r.forEach((o) => o(i)) : r[0](i);
    };
  };
  Qt = t(
    "__VUE_INSTANCE_SETTERS__",
    (s) => le = s
  ), Ms = t(
    "__VUE_SSR_SETTERS__",
    (s) => Pt = s
  );
}
const Ft = (e) => {
  const t = le;
  return Qt(e), e.scope.on(), () => {
    e.scope.off(), Qt(t);
  };
}, Tn = () => {
  le && le.scope.off(), Qt(null);
};
function zr(e) {
  return e.vnode.shapeFlag & 4;
}
let Pt = !1;
function Go(e, t = !1, s = !1) {
  t && Ms(t);
  const { props: n, children: r } = e.vnode, i = zr(e);
  Ro(e, n, i, t), Io(e, r, s || t);
  const o = i ? zo(e, t) : void 0;
  return t && Ms(!1), o;
}
function zo(e, t) {
  const s = e.type;
  e.accessCache = /* @__PURE__ */ Object.create(null), e.proxy = new Proxy(e.ctx, ho);
  const { setup: n } = s;
  if (n) {
    je();
    const r = e.setupContext = n.length > 1 ? Xo(e) : null, i = Ft(e), o = It(
      n,
      e,
      0,
      [
        e.props,
        r
      ]
    ), l = Yn(o);
    if (He(), i(), (l || e.sp) && !wt(e) && Sr(e), l) {
      if (o.then(Tn, Tn), t)
        return o.then((c) => {
          An(e, c);
        }).catch((c) => {
          ns(c, e, 0);
        });
      e.asyncDep = o;
    } else
      An(e, o);
  } else
    Qr(e);
}
function An(e, t, s) {
  M(t) ? e.type.__ssrInlineRender ? e.ssrRender = t : e.render = t : B(t) && (e.setupState = dr(t)), Qr(e);
}
function Qr(e, t, s) {
  const n = e.type;
  e.render || (e.render = n.render || Oe);
  {
    const r = Ft(e);
    je();
    try {
      po(e);
    } finally {
      He(), r();
    }
  }
}
const Qo = {
  get(e, t) {
    return se(e, "get", ""), e[t];
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
function Zs(e) {
  return e.exposed ? e.exposeProxy || (e.exposeProxy = new Proxy(dr(ji(e.exposed)), {
    get(t, s) {
      if (s in t)
        return t[s];
      if (s in xt)
        return xt[s](e);
    },
    has(t, s) {
      return s in t || s in xt;
    }
  })) : e.proxy;
}
function Zo(e) {
  return M(e) && "__vccOpts" in e;
}
const Is = (e, t) => /* @__PURE__ */ Wi(e, t, Pt), el = "3.5.40";
/**
* @vue/runtime-dom v3.5.40
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
let Fs;
const Rn = typeof window < "u" && window.trustedTypes;
if (Rn)
  try {
    Fs = /* @__PURE__ */ Rn.createPolicy("vue", {
      createHTML: (e) => e
    });
  } catch {
  }
const Xr = Fs ? (e) => Fs.createHTML(e) : (e) => e, tl = "http://www.w3.org/2000/svg", sl = "http://www.w3.org/1998/Math/MathML", Ne = typeof document < "u" ? document : null, On = Ne && /* @__PURE__ */ Ne.createElement("template"), nl = {
  insert: (e, t, s) => {
    t.insertBefore(e, s || null);
  },
  remove: (e) => {
    const t = e.parentNode;
    t && t.removeChild(e);
  },
  createElement: (e, t, s, n) => {
    const r = t === "svg" ? Ne.createElementNS(tl, e) : t === "mathml" ? Ne.createElementNS(sl, e) : s ? Ne.createElement(e, { is: s }) : Ne.createElement(e);
    return e === "select" && n && n.multiple != null && r.setAttribute("multiple", n.multiple), r;
  },
  createText: (e) => Ne.createTextNode(e),
  createComment: (e) => Ne.createComment(e),
  setText: (e, t) => {
    e.nodeValue = t;
  },
  setElementText: (e, t) => {
    e.textContent = t;
  },
  parentNode: (e) => e.parentNode,
  nextSibling: (e) => e.nextSibling,
  querySelector: (e) => Ne.querySelector(e),
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
      On.innerHTML = Xr(
        n === "svg" ? `<svg>${e}</svg>` : n === "mathml" ? `<math>${e}</math>` : e
      );
      const l = On.content;
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
const Pn = /* @__PURE__ */ Symbol("_vod"), ol = /* @__PURE__ */ Symbol("_vsh"), ll = /* @__PURE__ */ Symbol(""), cl = /(?:^|;)\s*display\s*:/;
function fl(e, t, s) {
  const n = e.style, r = Q(s);
  let i = !1;
  if (s && !r) {
    if (t)
      if (Q(t))
        for (const o of t.split(";")) {
          const l = o.slice(0, o.indexOf(":")).trim();
          s[l] == null && _t(n, l, "");
        }
      else
        for (const o in t)
          s[o] == null && _t(n, o, "");
    for (const o in s) {
      o === "display" && (i = !0);
      const l = s[o];
      l != null ? al(
        e,
        o,
        !Q(t) && t ? t[o] : void 0,
        l
      ) || _t(n, o, l) : _t(n, o, "");
    }
  } else if (r) {
    if (t !== s) {
      const o = n[ll];
      o && (s += ";" + o), n.cssText = s, i = cl.test(s);
    }
  } else t && e.removeAttribute("style");
  Pn in e && (e[Pn] = i ? n.display : "", e[ol] && (n.display = "none"));
}
const Mn = /\s*!important$/;
function _t(e, t, s) {
  if (P(s))
    s.forEach((n) => _t(e, t, n));
  else if (s == null && (s = ""), t.startsWith("--"))
    e.setProperty(t, s);
  else {
    const n = ul(e, t);
    Mn.test(s) ? e.setProperty(
      pe(n),
      s.replace(Mn, ""),
      "important"
    ) : e[n] = s;
  }
}
const In = ["Webkit", "Moz", "ms"], vs = {};
function ul(e, t) {
  const s = vs[t];
  if (s)
    return s;
  let n = ue(t);
  if (n !== "filter" && n in e)
    return vs[t] = n;
  n = Jn(n);
  for (let r = 0; r < In.length; r++) {
    const i = In[r] + n;
    if (i in e)
      return vs[t] = i;
  }
  return t;
}
function al(e, t, s, n) {
  return e.tagName === "TEXTAREA" && (t === "width" || t === "height") && Q(n) && s === n;
}
const Fn = "http://www.w3.org/1999/xlink";
function Nn(e, t, s, n, r, i = gi(t)) {
  n && t.startsWith("xlink:") ? s == null ? e.removeAttributeNS(Fn, t.slice(6, t.length)) : e.setAttributeNS(Fn, t, s) : s == null || i && !Gn(s) ? e.removeAttribute(t) : e.setAttribute(
    t,
    i ? "" : Me(s) ? String(s) : s
  );
}
function Dn(e, t, s, n, r) {
  if (t === "innerHTML" || t === "textContent") {
    s != null && (e[t] = t === "innerHTML" ? Xr(s) : s);
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
    l === "boolean" ? s = Gn(s) : s == null && l === "string" ? (s = "", o = !0) : l === "number" && (s = 0, o = !0);
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
const Ln = /* @__PURE__ */ Symbol("_vei");
function pl(e, t, s, n, r = null) {
  const i = e[Ln] || (e[Ln] = {}), o = i[t];
  if (n && o)
    o.value = n;
  else {
    const [l, c] = ml(t);
    if (n) {
      const h = i[t] = vl(
        n,
        r
      );
      hl(e, l, h, c);
    } else o && (dl(e, l, o, c), i[t] = void 0);
  }
}
const gl = /(Once|Passive|Capture)$/, _l = /^on:?(?:Once|Passive|Capture)$/;
function ml(e) {
  let t, s;
  for (; (s = e.match(gl)) && !_l.test(e); )
    t || (t = {}), e = e.slice(0, e.length - s[1].length), t[s[1].toLowerCase()] = !0;
  return [e[2] === ":" ? e.slice(3) : pe(e.slice(2)), t];
}
let ws = 0;
const bl = /* @__PURE__ */ Promise.resolve(), yl = () => ws || (bl.then(() => ws = 0), ws = Date.now());
function vl(e, t) {
  const s = (n) => {
    if (!n._vts)
      n._vts = Date.now();
    else if (n._vts <= s.attached)
      return;
    const r = s.value;
    if (P(r)) {
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
  return s.value = e, s.attached = yl(), s;
}
const jn = (e) => e.charCodeAt(0) === 111 && e.charCodeAt(1) === 110 && // lowercase letter
e.charCodeAt(2) > 96 && e.charCodeAt(2) < 123, wl = (e, t, s, n, r, i) => {
  const o = r === "svg";
  t === "class" ? il(e, n, o) : t === "style" ? fl(e, s, n) : Xt(t) ? Zt(t) || pl(e, t, s, n, i) : (t[0] === "." ? (t = t.slice(1), !0) : t[0] === "^" ? (t = t.slice(1), !1) : xl(e, t, n, o)) ? (Dn(e, t, n), !e.tagName.includes("-") && (t === "value" || t === "checked" || t === "selected") && Nn(e, t, n, o, i, t !== "value")) : /* #11081 force set props for possible async custom element */ e._isVueCE && // #12408 check if it's declared prop or it's async custom element
  (Sl(e, t) || // @ts-expect-error _def is private
  e._def.__asyncLoader && (/[A-Z]/.test(t) || !Q(n))) ? Dn(e, ue(t), n, i, t) : (t === "true-value" ? e._trueValue = n : t === "false-value" && (e._falseValue = n), Nn(e, t, n, o));
};
function xl(e, t, s, n) {
  if (n)
    return !!(t === "innerHTML" || t === "textContent" || t in e && jn(t) && M(s));
  if (t === "spellcheck" || t === "draggable" || t === "translate" || t === "autocorrect" || t === "sandbox" && e.tagName === "IFRAME" || t === "form" || t === "list" && e.tagName === "INPUT" || t === "type" && e.tagName === "TEXTAREA")
    return !1;
  if (t === "width" || t === "height") {
    const r = e.tagName;
    if (r === "IMG" || r === "VIDEO" || r === "CANVAS" || r === "SOURCE")
      return !1;
  }
  return jn(t) && Q(s) ? !1 : t in e;
}
function Sl(e, t) {
  const s = (
    // @ts-expect-error _def is private
    e._def.props
  );
  if (!s)
    return !1;
  const n = ue(t);
  return Array.isArray(s) ? s.some((r) => ue(r) === n) : Object.keys(s).some((r) => ue(r) === n);
}
const Hn = {};
// @__NO_SIDE_EFFECTS__
function El(e, t, s) {
  let n = /* @__PURE__ */ xr(e, t);
  es(n) && (n = X({}, n, t));
  class r extends en {
    constructor(o) {
      super(n, o, s);
    }
  }
  return r.def = n, r;
}
const Cl = typeof HTMLElement < "u" ? HTMLElement : class {
};
class en extends Cl {
  constructor(t, s = {}, n = Vn) {
    super(), this._def = t, this._props = s, this._createApp = n, this._isVueCE = !0, this._instance = null, this._app = null, this._nonce = this._def.nonce, this._connected = !1, this._resolved = !1, this._patching = !1, this._dirty = !1, this._numberProps = null, this._styleChildren = /* @__PURE__ */ new WeakSet(), this._styleAnchors = /* @__PURE__ */ new WeakMap(), this._ob = null, this.shadowRoot && n !== Vn ? this._root = this.shadowRoot : t.shadowRoot !== !1 ? (this.attachShadow(
      X({}, t.shadowRootOptions, {
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
      if (t instanceof en) {
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
    this._connected = !1, gr(() => {
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
      if (i && !P(i))
        for (const c in i) {
          const h = i[c];
          (h === Number || h && h.type === Number) && (c in this._props && (this._props[c] = un(this._props[c])), (l || (l = /* @__PURE__ */ Object.create(null)))[ue(c)] = !0);
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
        j(this, n) || Object.defineProperty(this, n, {
          // unwrap ref to be consistent with public instance behavior
          get: () => hr(s[n])
        });
  }
  _resolveProps(t) {
    const { props: s } = t, n = P(s) ? s : Object.keys(s || {});
    for (const r of Object.keys(this))
      r[0] !== "_" && n.includes(r) && this._setProp(r, this[r]);
    for (const r of n.map(ue))
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
    let n = s ? this.getAttribute(t) : Hn;
    const r = ue(t);
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
    if (s !== this._props[t] && (this._dirty = !0, s === Hn ? delete this._props[t] : (this._props[t] = s, t === "key" && this._app && (this._app._ceVNode.key = s)), r && this._instance && this._update(), n)) {
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
    const s = Pe(this._def, X(t, this._props));
    return this._instance || (s.ce = (n) => {
      this._instance = n, n.ce = this, n.isCE = !0;
      const r = (i, o) => {
        this.dispatchEvent(
          new CustomEvent(
            i,
            es(o[0]) ? X({ detail: o }, o[0]) : { detail: o }
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
const Tl = /* @__PURE__ */ X({ patchProp: wl }, nl);
let $n;
function Zr() {
  return $n || ($n = No(Tl));
}
const Al = ((...e) => {
  Zr().render(...e);
}), Vn = ((...e) => {
  const t = Zr().createApp(...e), { mount: s } = t;
  return t.mount = (n) => {
    const r = Ol(n);
    if (!r) return;
    const i = t._component;
    !M(i) && !i.render && !i.template && (i.template = r.innerHTML), r.nodeType === 1 && (r.textContent = "");
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
  return Q(e) ? document.querySelector(e) : e;
}
const Pl = 8e3, Ml = 2e3, Un = 1e6, fe = "Unable to complete this request.", Wn = "Request timed out.", St = "Request cancelled.", ei = `
  state pid version bindAddress port ready healthMessage uptimeSeconds
`, Il = `query YarrRuntime { yarrRuntime { ${ei} } }`, Fl = `mutation ControlYarr($action: YarrControlAction!) {
  controlYarr(action: $action) { ${ei} }
}`;
function tn(e) {
  return typeof e == "object" && e !== null && !Array.isArray(e);
}
function Et(e) {
  return new DOMException(e, "AbortError");
}
async function Nl(e) {
  if (window.csrf_token || e.aborted) {
    if (e.aborted) throw Et(St);
    return;
  }
  await new Promise((t, s) => {
    const n = window.setInterval(() => {
      window.csrf_token && o(t);
    }, 20), r = window.setTimeout(() => o(t), Ml), i = () => o(() => s(Et(St))), o = (l) => {
      window.clearInterval(n), window.clearTimeout(r), e.removeEventListener("abort", i), l();
    };
    e.addEventListener("abort", i, { once: !0 });
  });
}
async function Dl(e) {
  const t = e.body;
  if (!t) throw new Error(fe);
  const s = e.headers.get("content-length");
  if (s && /^(?:0|[1-9]\d*)$/.test(s)) {
    const c = Number(s);
    if (Number.isSafeInteger(c) && c > Un) {
      try {
        await t.cancel();
      } catch {
      }
      throw new Error(fe);
    }
  }
  const n = t.getReader(), r = [];
  let i = 0;
  try {
    for (; ; ) {
      const { done: c, value: h } = await n.read();
      if (c) break;
      if (i += h.byteLength, i > Un) {
        try {
          await n.cancel();
        } catch {
        }
        throw new Error(fe);
      }
      r.push(h);
    }
  } catch (c) {
    throw c instanceof Error && c.message === fe ? c : new Error(fe);
  } finally {
    n.releaseLock();
  }
  const o = new Uint8Array(i);
  let l = 0;
  for (const c of r)
    o.set(c, l), l += c.byteLength;
  try {
    const c = JSON.parse(new TextDecoder("utf-8", { fatal: !0 }).decode(o));
    if (!tn(c)) throw new Error(fe);
    return c;
  } catch {
    throw new Error(fe);
  }
}
async function Ll(e) {
  if (e)
    try {
      await e.cancel();
    } catch {
    }
}
async function ti(e, t, s) {
  const n = new AbortController();
  let r = !1, i = !1;
  const o = window.setTimeout(() => {
    r = !0, n.abort(Et(Wn));
  }, Pl), l = () => n.abort(Et(St));
  s != null && s.aborted ? l() : s == null || s.addEventListener("abort", l, { once: !0 });
  try {
    if (await Nl(n.signal), n.signal.aborted) throw Et(St);
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
      throw i = !0, await Ll(c.body), n.abort(), new Error(fe);
    const h = await Dl(c);
    if (Array.isArray(h.errors) && h.errors.length > 0) throw new Error(fe);
    if (!tn(h.data)) throw new Error(fe);
    return h.data;
  } catch (c) {
    throw r ? new Error(Wn) : i ? new Error(fe) : n.signal.aborted ? new Error(St) : c instanceof Error && c.message === fe ? c : new Error(fe);
  } finally {
    window.clearTimeout(o), s == null || s.removeEventListener("abort", l);
  }
}
function si(e, t) {
  const s = e[t];
  if (!tn(s)) throw new Error(fe);
  return s;
}
async function jl(e) {
  return si(await ti(Il, void 0, e), "yarrRuntime");
}
async function Hl(e, t) {
  return si(
    await ti(Fl, { action: e }, t),
    "controlYarr"
  );
}
const $l = ["aria-busy"], Vl = {
  key: 0,
  class: "yarr-dashboard__error",
  role: "alert"
}, Ul = {
  key: 1,
  role: "status"
}, Wl = {
  class: "yarr-dashboard__signals",
  "aria-label": "Yarr lifecycle signals"
}, Bl = { class: "yarr-dashboard__footer" }, Kl = ["disabled"], Yl = /* @__PURE__ */ xr({
  __name: "YarrDashboard.ce",
  setup(e) {
    const t = /* @__PURE__ */ Ut(), s = /* @__PURE__ */ Ut(), n = /* @__PURE__ */ Ut(""), r = /* @__PURE__ */ Ut(!1);
    let i = !1, o, l, c, h = !1, a = 0;
    const p = () => i && document.visibilityState !== "hidden", S = Is(() => {
      var D, F;
      return ((D = s.value) == null ? void 0 : D.state) === "running" ? "STOP" : ((F = s.value) == null ? void 0 : F.state) === "stopped" ? "START" : null;
    }), E = Is(() => S.value === "STOP" ? "Stop Yarr" : "Start Yarr");
    function L() {
      o !== void 0 && window.clearTimeout(o), o = void 0;
    }
    function R() {
      L(), a += 1, l == null || l.abort();
    }
    function k() {
      L(), p() && (o = window.setTimeout(() => {
        H();
      }, 3e4));
    }
    async function H() {
      if (!p()) return;
      l == null || l.abort(), l = new AbortController();
      const D = ++a;
      r.value = !0, n.value = "";
      try {
        const F = await jl(l.signal);
        D === a && (s.value = F);
      } catch {
        D === a && !l.signal.aborted && (n.value = "Status unavailable. Open settings for recovery details.");
      } finally {
        D === a && (r.value = !1, k());
      }
    }
    async function I() {
      if (!S.value) return;
      l == null || l.abort(), l = new AbortController();
      const D = ++a;
      r.value = !0, n.value = "";
      try {
        const F = await Hl(S.value, l.signal);
        D === a && (s.value = F);
      } catch {
        D === a && !l.signal.aborted && (n.value = "Yarr did not complete the action. Open settings and review logs.");
      } finally {
        D === a && (r.value = !1, k());
      }
    }
    function V() {
      h && (i = T()), p() ? H() : R();
    }
    function T() {
      if (!t.value || document.visibilityState === "hidden") return !1;
      const D = t.value.getBoundingClientRect(), F = window.innerWidth || document.documentElement.clientWidth, de = window.innerHeight || document.documentElement.clientHeight;
      return D.bottom > 0 && D.right > 0 && D.top < de && D.left < F;
    }
    function J() {
      const D = T();
      D !== i && (i = D, p() ? H() : R());
    }
    return Tr(() => {
      document.addEventListener("visibilitychange", V), typeof IntersectionObserver == "function" ? (c = new IntersectionObserver((D) => {
        const F = D.some((de) => de.isIntersecting);
        F !== i && (i = F, p() ? H() : R());
      }), t.value && c.observe(t.value)) : (h = !0, window.addEventListener("scroll", J, { passive: !0 }), window.addEventListener("resize", J), i = T(), p() && H());
    }), Ar(() => {
      i = !1, R(), c == null || c.disconnect(), h && (window.removeEventListener("scroll", J), window.removeEventListener("resize", J)), document.removeEventListener("visibilitychange", V);
    }), (D, F) => (tt(), dt("section", {
      ref_key: "root",
      ref: t,
      class: "yarr-dashboard",
      "aria-labelledby": "yarr-dashboard-title",
      "aria-busy": r.value
    }, [
      F[4] || (F[4] = z("header", { class: "yarr-dashboard__header" }, [
        z("div", null, [
          z("p", { class: "yarr-dashboard__eyebrow" }, "Yarr"),
          z("h2", { id: "yarr-dashboard-title" }, "Service operations")
        ]),
        z("a", { href: "/Settings/Yarr" }, "Open settings")
      ], -1)),
      n.value ? (tt(), dt("p", Vl, Fe(n.value), 1)) : s.value ? (tt(), dt(Ce, { key: 2 }, [
        z("ol", Wl, [
          z("li", null, [
            F[0] || (F[0] = z("span", null, "Process", -1)),
            z("strong", null, Fe(s.value.state), 1)
          ]),
          z("li", null, [
            F[1] || (F[1] = z("span", null, "Ready", -1)),
            z("strong", null, Fe(s.value.ready ? "Ready" : "Not ready"), 1)
          ]),
          z("li", null, [
            F[2] || (F[2] = z("span", null, "Endpoint", -1)),
            z("strong", null, Fe(s.value.bindAddress) + ":" + Fe(s.value.port), 1)
          ]),
          z("li", null, [
            F[3] || (F[3] = z("span", null, "Version", -1)),
            z("strong", null, Fe(s.value.version ?? "Unavailable"), 1)
          ])
        ]),
        z("div", Bl, [
          z("p", null, Fe(S.value ? s.value.healthMessage : "State is changing or unavailable. Wait for the next refresh before acting."), 1),
          S.value ? (tt(), dt("button", {
            key: 0,
            type: "button",
            disabled: r.value,
            onClick: I
          }, Fe(r.value ? "Working..." : E.value), 9, Kl)) : Bo("", !0)
        ])
      ], 64)) : (tt(), dt("p", Ul, "Checking Yarr..."))
    ], 8, $l));
  }
}), ql = /* @__PURE__ */ El(Yl, { shadowRoot: !1 });
customElements.get("yarr-dashboard") || customElements.define("yarr-dashboard", ql);
