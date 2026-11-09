const fs = require('fs');
let code = fs.readFileSync('scratch/test_card_promo_09c_r6.js', 'utf8');

const target = `  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new MockClassList();
  }
  get className() {
    return Array.from(this.classList.classes).join(' ');
  }
  set className(val) {
    this.classList.classes = new Set((val || '').split(/\\s+/).filter(Boolean));
    this.attributes = {};
    this.style = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.checked = false;
    this.dataset = {};
    this.listeners = {};
    this.parentElement = null;
  }`;

const repl = `  constructor(tag, id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = new MockClassList();
    this.attributes = {};
    this.style = {};
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this.value = '';
    this.checked = false;
    this.dataset = {};
    this.listeners = {};
    this.parentElement = null;
  }
  get className() {
    return Array.from(this.classList.classes).join(' ');
  }
  set className(val) {
    this.classList.classes = new Set((val || '').split(/\\s+/).filter(Boolean));
  }`;

code = code.replace(target, repl);
fs.writeFileSync('scratch/test_card_promo_09c_r6.js', code, 'utf8');
console.log('Fixed constructor and className getter/setter');

