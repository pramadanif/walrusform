import React from 'react';

const AppBackground = () => {
  return (
    <>
      <div className="bg-blobs bg-white">
        <div className="blob blob-1" style={{ width: '50vw', height: '50vh', background: '#dcfce7', top: '-10%', left: '-5%' }}></div>
        <div className="blob blob-2" style={{ width: '60vw', height: '60vh', background: '#e0f2fe', top: '10%', right: '-10%', animationDuration: '30s', animationDelay: '-5s' }}></div>
        <div className="blob blob-3" style={{ width: '50vw', height: '60vh', background: '#fae8ff', bottom: '-10%', left: '10%', animationDuration: '20s', animationDelay: '-2s' }}></div>
        <div className="blob blob-4" style={{ width: '40vw', height: '50vh', background: '#f5f3ff', top: '30%', left: '25%' }}></div>
        <div className="blob blob-5" style={{ width: '45vw', height: '55vh', background: '#ecfeff', bottom: '20%', right: '10%' }}></div>
      </div>
    </>
  );
};

export default AppBackground;
