import React from 'react';
export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ console.error('UI Error', error, info); }
  render(){ if (this.state.hasError) return <div>Something went wrong.</div>; return this.props.children; }
}