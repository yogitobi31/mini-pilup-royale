export function TitleScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className='screen game-screen title-screen'>
      <div className='title-panel'>
        <h1 className='menu-title'>필업 아레나: 마지막 종</h1>
        <p className='menu-subtitle'>Mini Pilup Royale</p>
        <button className='start-btn' onClick={onStart}>출전하기</button>
      </div>
    </div>
  );
}
