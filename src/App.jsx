import { useState, useEffect } from "react";

const CATALOG = {
  version: 1,
  free: [
    { id: "boxes-of-12", name: "Boxes of 12", tagline: "A graph paper strategy game",
      description: "Place numbers on a grid. Connected groups that sum to 12 can be captured. Most squares wins.",
      players: "1–2", time: "10–20 min" }
  ],
  packs: [
    {
      id: "pack-01", name: "Strategy Pack", price: 2.99,
      games: [
        { id: "tetro-grid", name: "Tetro-Grid", tagline: "Territory through tetrominos",
          description: "Take turns placing Tetris pieces on a grid. Complete a line to claim it in your color. Opponent's cells switch to yours.",
          players: "2", time: "15–25 min" },
        { id: "odds", name: "Odds", tagline: "Force the board your way",
          description: "Players place numbers on a spoke board trying to force the total sum to be odd or even. Simple rules, deep strategy.",
          players: "2", time: "5–15 min" }
      ]
    },
    {
      id: "pack-02", name: "Party Pack", price: 2.99,
      games: [
        { id: "splits", name: "Splits", tagline: "Cooperate or betray",
          description: "Cards 1–5, each used once per set. Target sum 7 cooperates — anything else defects. Trust no one.",
          players: "2", time: "10–20 min" },
        { id: "box-of-doom", name: "Box of Doom", tagline: "A game of trust & deception",
          description: "P1 peeks inside the box — good or bad — then convinces P2 whether to take it. Bluff or tell the truth.",
          players: "2", time: "5–10 min" }
      ]
    }
  ],
  multiplayer: { id: "multiplayer", price: 0.99 }
};

const C = {
  bg:"#07090d", surface:"#0d1117", border:"#1a2a3a",
  text:"#7ab8cc", dim:"#4a7a8a", faint:"#1a3a4a",
  accentHi:"#7dd3f0", accent:"#2a7a9a",
  free:"#4ade80", locked:"#4a5568", gold:"#fbbf24",
};
const font = "'Courier New', monospace";

function Divider() {
  return <div style={{ width:"100%", maxWidth:400, borderTop:`1px solid ${C.border}`, margin:"12px 0" }} />;
}

function PriceTag({ price }) {
  return (
    <div style={{ fontSize:".65rem", color:C.gold, border:`1px solid ${C.gold}55`,
      borderRadius:3, padding:"3px 8px", letterSpacing:".06em", flexShrink:0 }}>
      ${price.toFixed(2)}
    </div>
  );
}

function GameRow({ game, unlocked, onTap, indented }) {
  return (
    <div onClick={onTap} style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding: indented ? "9px 12px 9px 20px" : "12px",
      borderLeft: indented ? `2px solid ${unlocked ? C.accentHi+"44" : C.border}` : "none",
      cursor:"pointer", marginBottom:2,
      borderRadius: indented ? "0 4px 4px 0" : 4,
      background: unlocked ? C.surface : "transparent",
      border: indented ? undefined : `1px solid ${unlocked ? C.border : "transparent"}`,
    }}>
      <div>
        <div style={{ fontSize:".82rem", fontWeight:"bold", letterSpacing:".08em",
          color: unlocked ? C.accentHi : C.locked }}>
          {unlocked ? "▶ " : "· "}{game.name}
        </div>
        <div style={{ fontSize:".6rem", color:C.dim, marginTop:2 }}>{game.tagline}</div>
      </div>
      {unlocked
        ? <div style={{ fontSize:".58rem", color:C.dim, textAlign:"right" }}>
            <div>{game.players}p</div><div>{game.time}</div>
          </div>
        : <div style={{ fontSize:".6rem", color:C.locked }}>→</div>
      }
    </div>
  );
}

function PackHeader({ pack, owned, onTap }) {
  return (
    <div onClick={onTap} style={{
      display:"flex", justifyContent:"space-between", alignItems:"center",
      padding:"7px 12px", marginBottom:4,
      cursor: pack.comingSoon || owned ? "default" : "pointer"
    }}>
      <div style={{ fontSize:".58rem", letterSpacing:".14em",
        color: owned ? C.free+"99" : pack.comingSoon ? C.faint : C.dim }}>
        {owned ? "✓ " : ""}{pack.name.toUpperCase()}
        {pack.comingSoon && " · COMING SOON"}
      </div>
      {!owned && !pack.comingSoon && <PriceTag price={pack.price} />}
    </div>
  );
}

function PreviewScreen({ preview, onPurchase, onBack }) {
  const { game, pack } = preview;
  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex",
      flexDirection:"column", alignItems:"center", padding:"20px 16px", fontFamily:font }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:C.dim,
          cursor:"pointer", fontSize:".7rem", marginBottom:24,
          letterSpacing:".08em", fontFamily:font }}>← back</button>

        <div style={{ fontSize:"1.4rem", fontWeight:"bold", letterSpacing:".16em",
          color:C.accentHi, marginBottom:4 }}>
          {game ? game.name.toUpperCase() : pack.name.toUpperCase()}
        </div>
        <div style={{ fontSize:".65rem", color:C.dim, letterSpacing:".1em", marginBottom:20 }}>
          {game ? game.tagline : pack.isMultiplayer ? "Play any game with a friend anywhere"
            : `${pack.games?.length} games included`}
        </div>

        <div style={{ width:"100%", height:160, border:`1px solid ${C.border}`,
          borderRadius:4, background:C.surface, display:"flex", alignItems:"center",
          justifyContent:"center", marginBottom:20, color:C.faint,
          fontSize:".65rem", letterSpacing:".1em" }}>
          PREVIEW IMAGE
        </div>

        <div style={{ fontSize:".72rem", color:C.text, lineHeight:1.8, marginBottom:20 }}>
          {game ? game.description : pack.isMultiplayer
            ? "Unlock multiplayer for all games. Send a friend an invite link via text — no accounts, no setup. Direct phone-to-phone connection."
            : `Includes ${pack.games?.map(g => g.name).join(" and ")}.`}
        </div>

        {!game && !pack.isMultiplayer && pack.games?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:".58rem", letterSpacing:".12em", color:C.dim, marginBottom:8 }}>INCLUDES</div>
            {pack.games.map(g => (
              <div key={g.id} style={{ padding:"8px 12px", border:`1px solid ${C.border}`,
                borderRadius:4, marginBottom:4, background:C.surface }}>
                <div style={{ fontSize:".76rem", color:C.accentHi, letterSpacing:".06em" }}>{g.name}</div>
                <div style={{ fontSize:".6rem", color:C.dim, marginTop:2 }}>{g.tagline}</div>
              </div>
            ))}
          </div>
        )}

        {game && (
          <div style={{ fontSize:".62rem", color:C.dim, marginBottom:20, padding:"8px 12px",
            border:`1px solid ${C.border}`, borderRadius:4, background:C.surface }}>
            Part of <span style={{ color:C.accentHi }}>{pack.name}</span>
            {pack.games?.length > 1 &&
              ` — also includes ${pack.games.filter(g=>g.id!==game.id).map(g=>g.name).join(", ")}`}
          </div>
        )}

        <button onClick={onPurchase} style={{ width:"100%", padding:14, background:"#0a1a0a",
          border:`1px solid ${C.free}`, borderRadius:4, color:C.free, fontFamily:font,
          fontWeight:"bold", fontSize:".88rem", letterSpacing:".1em", cursor:"pointer",
          boxShadow:`0 0 20px ${C.free}22`, marginBottom:10 }}>
          UNLOCK {pack.name.toUpperCase()} — ${pack.price?.toFixed(2)}
        </button>

        <button onClick={onBack} style={{ width:"100%", padding:10, background:"none",
          border:`1px solid ${C.border}`, borderRadius:4, color:C.dim, fontFamily:font,
          fontSize:".76rem", cursor:"pointer", letterSpacing:".08em" }}>← go back</button>
      </div>
    </div>
  );
}

export default function App() {
  const [owned, setOwned]             = useState({ free: true });
  const [mpOwned, setMpOwned]         = useState(false);
  const [preview, setPreview]         = useState(null);
  const [newAlert, setNewAlert]       = useState(true);
  const [activeGame, setActiveGame]   = useState(null);

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'NAV_HOME') setActiveGame(null);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const isOwned = id => !!owned[id];

  const handleGameTap = (game, pack) => {
    if (pack.id === "free" || isOwned(pack.id)) setActiveGame(game.id);
    else setPreview({ game, pack });
  };

  const handlePurchase = packId => {
    if (packId === "multiplayer") { setMpOwned(true); setPreview(null); return; }
    setOwned(o => ({ ...o, [packId]: true }));
    setPreview(null);
  };

  if (activeGame) return (
    <div style={{ position:"fixed", inset:0, zIndex:100, background:"#000" }}>
      <iframe
        src={`/games/${activeGame}/index.html`}
        style={{ width:"100%", height:"100%", border:"none" }}
        title={activeGame}
        allow="clipboard-write"
      />
    </div>
  );

  if (preview) return (
    <PreviewScreen preview={preview}
      onPurchase={() => handlePurchase(preview.pack.id)}
      onBack={() => setPreview(null)} />
  );

  return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex",
      flexDirection:"column", alignItems:"center", padding:"20px 16px", fontFamily:font }}>

      {newAlert && (
        <div style={{ width:"100%", maxWidth:400, background:"#0a1a0a",
          border:`1px solid ${C.free}`, borderRadius:4, padding:"8px 12px",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:16, fontSize:".65rem", color:C.free }}>
          <span>✦ New games available — update the app</span>
          <button onClick={() => setNewAlert(false)}
            style={{ background:"none", border:"none", color:C.free, cursor:"pointer" }}>✕</button>
        </div>
      )}

      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:"2rem", fontWeight:"bold", letterSpacing:".2em",
          color:C.accentHi, textShadow:`0 0 40px ${C.accent}55` }}>HEY WANNA</div>
        <div style={{ fontSize:"2rem", fontWeight:"bold", letterSpacing:".2em",
          color:C.accentHi, textShadow:`0 0 40px ${C.accent}55`, marginTop:-8 }}>PLAY?</div>
        <div style={{ fontSize:".58rem", letterSpacing:".18em", color:C.dim, marginTop:4 }}>
          NO ADS · NO ACCOUNTS · JUST GAMES
        </div>
      </div>

      <div style={{ width:"100%", maxWidth:400 }}>
        {CATALOG.free.map(game => (
          <GameRow key={game.id} game={game} unlocked
            onTap={() => handleGameTap(game, { id:"free" })} />
        ))}
      </div>

      <Divider />

      {CATALOG.packs.map(pack => (
        <div key={pack.id} style={{ width:"100%", maxWidth:400, marginBottom:8 }}>
          <PackHeader pack={pack} owned={isOwned(pack.id)}
            onTap={() => !isOwned(pack.id) && !pack.comingSoon && setPreview({ game:null, pack })} />
          {!pack.comingSoon && pack.games.map(game => (
            <GameRow key={game.id} game={game} unlocked={isOwned(pack.id)}
              onTap={() => handleGameTap(game, pack)} indented />
          ))}
        </div>
      ))}

      <Divider />

      <div style={{ width:"100%", maxWidth:400 }}>
        <div onClick={() => !mpOwned && setPreview({ game:null, pack:{
            id:"multiplayer", name:"Multiplayer", price:CATALOG.multiplayer.price, isMultiplayer:true }})}
          style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 12px", border:`1px solid ${mpOwned ? C.free+"55" : C.border}`,
            borderRadius:4, cursor: mpOwned ? "default" : "pointer",
            background:C.surface, marginBottom:4 }}>
          <div>
            <div style={{ fontSize:".78rem", color: mpOwned ? C.free : C.text, letterSpacing:".06em" }}>
              {mpOwned ? "✓" : "🔗"} MULTIPLAYER
            </div>
            <div style={{ fontSize:".6rem", color:C.dim, marginTop:2 }}>
              Play any game with a friend via invite link
            </div>
          </div>
          {!mpOwned && <PriceTag price={CATALOG.multiplayer.price} />}
        </div>
      </div>

      <Divider />

      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginTop:4 }}>
        <button onClick={() => alert("Checking purchases with Google Play…")}
          style={{ background:"none", border:"none", color:C.faint, cursor:"pointer",
            fontSize:".62rem", letterSpacing:".08em", fontFamily:font }}>
          RESTORE PURCHASES
        </button>
        <div style={{ fontSize:".52rem", color:C.faint, letterSpacing:".06em" }}>
          MADE WITH CLAUDE · NO ADS EVER
        </div>
      </div>
    </div>
  );
}
