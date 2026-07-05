import { Component, OnInit, ElementRef, Renderer2 } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-original-site',
  template: `<div id="original-container"></div>`
})
export class OriginalSiteComponent implements OnInit {
  constructor(private http: HttpClient, private el: ElementRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.http.get('assets/original/index.html', { responseType: 'text' }).subscribe(html => {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Append head nodes (links, meta, styles) to document head
        if (doc.head) {
          Array.from(doc.head.children).forEach(node => {
            const imported = document.importNode(node, true);

            if (imported.nodeName === 'LINK' && imported instanceof HTMLLinkElement) {
              const href = imported.getAttribute('href');
              if (href && !/^https?:\/\//.test(href) && !href.startsWith('//')) {
                imported.setAttribute('href', `assets/original/${href}`);
              }
            }

            if (imported.nodeName === 'SCRIPT' && imported instanceof HTMLScriptElement) {
              const src = imported.getAttribute('src');
              if (src && !/^https?:\/\//.test(src) && !src.startsWith('//')) {
                imported.setAttribute('src', `assets/original/${src}`);
              }
            }

            this.renderer.appendChild(document.head, imported);
          });
        }

        const container: HTMLElement = this.el.nativeElement.querySelector('#original-container');
        if (container && doc.body) {
          container.innerHTML = doc.body.innerHTML;
        }

        // Execute scripts referenced in the original HTML
        const scripts = doc.querySelectorAll('script');
        scripts.forEach(s => {
          const src = s.getAttribute('src');
          const scriptEl = this.renderer.createElement('script');
          if (src) {
            const isExternal = src.startsWith('http') || src.startsWith('//');
            const srcPath = isExternal ? src : `assets/original/${src}`;
            this.renderer.setAttribute(scriptEl, 'src', srcPath);
          } else {
            scriptEl.text = s.textContent || '';
          }
          this.renderer.appendChild(document.body, scriptEl);
        });
      } catch (err) {
        console.error('Failed to load original site HTML', err);
      }
    });
  }
}
