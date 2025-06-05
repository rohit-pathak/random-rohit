# Observing resize events with Angular HostDirectives and ResizeObserver

I was building some chart components and I wanted to make them responsive. My main problem was:

> How do I get the dimensions of the chart component’s host element whenever it is resized so that I can adjust the SVG and the shapes/scales within it?

The browser's [ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) exists just for this purpose. As we look at its API, we see that one instance of a ResizeObserver can observe multiple DOM elements (the callback you provide accepts a list of DOM elements that have been resized).

## Creating a ResizeObserverService

In an Angular project, this suggests having one root service, let’s say a `ResizeObserverService`, that can keep track of the nodes we want to observe. When a node is observed through this service, we can expose a signal that updates as the node is resized.

```
@Injectable({
  providedIn: 'root'
})
export class ResizeObserverService {

  private elementToResizeSignals = new Map<Element, WritableSignal<DOMRectReadOnly>>();

  private resizeObserver: ResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const dimensionSignal = this.elementToResizeSignals.get(entry.target);
      if (dimensionSignal) {
        dimensionSignal.set(entry.contentRect);
      }
    }
  });

  public observeResize(elementRef: ElementRef<Element>): Signal<DOMRectReadOnly> {
    const dimensions = signal(elementRef.nativeElement.getBoundingClientRect());
    this.elementToResizeSignals.set(elementRef.nativeElement, dimensions);
    this.resizeObserver.observe(elementRef.nativeElement);
    return dimensions;
  }

  public unObserve(elementRef: ElementRef<Element>): void {
    this.resizeObserver.unobserve(elementRef.nativeElement);
    this.elementToResizeSignals.delete(elementRef.nativeElement);
  }
}

```

Note the use of a `Map` which allows us to store object references (in this case the DOM nodes) as keys.

From the perspective of using this in a component, we’d have to `observeResize()` on init and `unObserve()` when the component is destroyed. It’s a fine approach but adding `ngOnInit` and `ngOnDestroy` to every component where we want to use this still seems tedious. Can we make this simpler?

## Simplifying further with a ResizeDirective
This is where Angular’s host directives come in. These are just directives you can apply to an Angular component using the `hostDirectives` property in the component decorator. A host directive goes through the same lifecycle as the component that it is applied to. So if we were to define a `ResizeDirective` and apply it to a component, it would init and destroy with the component.

```
@Directive({
  selector: '[appResize]',
  standalone: true
})
export class ResizeDirective implements OnDestroy {

  private resizeObserverService = inject(ResizeObserverService);
  private hostElementRef = inject(ElementRef);

  public dimensions = this.resizeObserverService.observeResize(this.hostElementRef);

  ngOnDestroy() {
    this.resizeObserverService.unObserve(this.hostElementRef);
  }
}
```

Note how with dependency injection we can get access to the host component’s `ElementRef`.

But how do we get access to the directive’s `dimensions` signal in our component? We first need to apply the `ResizeDirective` to the component through the `hostDirectives` property in the component decorator. Then we can get the directive instance with dependency injection to access its `dimensions` signal:

```
@Component({
  …
  hostDirectives: [ResizeDirective]
})
export class DonutChartComponent<T> implements AfterViewInit {
  private dimensions = inject(ResizeDirective).dimensions;
  
  // ... do stuff when host's dimensions change
}
```

And that’s it! Whenever we want to access a component's host element's dimensions, we just apply this `ResizeDirective` to it as a `hostDirective` and we get a `dimensions` signal that we can do stuff with, all without worrying about cleanup or having to deal with the `ResizeObserver` callback.

