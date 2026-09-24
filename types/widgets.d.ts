declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      'api-sports-widget': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          [key: `data-${string}`]: string | undefined;
        },
        HTMLElement
      >;
    }
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    'api-sports-widget': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        [key: `data-${string}`]: string | undefined;
      },
      HTMLElement
    >;
  }
}
