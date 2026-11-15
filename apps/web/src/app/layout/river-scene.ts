import { Component } from '@angular/core';

@Component({
  selector: 'app-river-scene',
  template: `
    <div class="scene">
      <svg viewBox="0 0 640 460" role="img" aria-label="Une église au bord du Rhône, devant les collines d’Ardèche">
        <rect width="640" height="460" rx="28" fill="#004874"></rect>
        <circle cx="508" cy="86" r="36" fill="#e4c98a"></circle>
        <path d="M0 168c70 28 120-18 190 8 78 28 120 8 190-6 70-14 150 10 260-18v78H0Z" fill="#005890"></path>
        <path d="M0 214c90 20 150-24 240 4 86 26 130-8 210 6 54 10 120 8 190-12v70H0Z" fill="#00689c"></path>
        <path d="M0 268c80 18 150 46 250 28 110-20 170 8 250 4 60-2 100 10 140 2v78H0Z" fill="#e6d7b8"></path>
        <path d="M0 330c120 22 180-8 300 10 120 18 180-6 340 8v122H0Z" fill="#009bcd"></path>
        <path d="M36 372c90-16 150 18 250 2 110-18 170 14 280-4" fill="none" stroke="#cfeef8" stroke-width="2.5" stroke-linecap="round" opacity="0.75"></path>
        <path d="M70 404c80-12 140 16 230 2 100-16 160 12 250-2" fill="none" stroke="#cfeef8" stroke-width="2" stroke-linecap="round" opacity="0.4"></path>
        <path d="M214 286 292 214 370 286Z" fill="#f3e6c8"></path>
        <rect x="232" y="286" width="100" height="72" rx="2" fill="#f7f3ea"></rect>
        <rect x="270" y="312" width="24" height="46" rx="2" fill="#003e68"></rect>
        <rect x="282" y="176" width="18" height="40" fill="#f7f3ea"></rect>
        <path d="M291 156v-20M281 146h20" stroke="#e4c98a" stroke-width="4" stroke-linecap="round"></path>
        <path d="M468 356 508 346 540 356 530 372 456 378Z" fill="#e4c98a"></path>
        <path d="M492 346v-18" stroke="#f7f3ea" stroke-width="2"></path>
      </svg>
    </div>
  `,
})
export class RiverScene {}
