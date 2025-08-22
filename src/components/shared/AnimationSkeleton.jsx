export default function AnimationSkeleton({ className = '', style = {} }) {
  return (
    <div 
      className={`animate-pulse bg-background-light rounded-xl ${className}`}
      style={style}
      role="progressbar"
      aria-busy="true"
    />
  );
}
