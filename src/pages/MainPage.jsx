const MainPage = () => {
  const handleGetStarted = () => {
    window.location.href = "http://localhost:3001/login";
  };

  const handleHowItWorks = () => {
    alert("Expliquez ici comment fonctionne l'application !");
    // Remplacez par un vrai modal ou une page plus tard
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <img
        src="/src/assets/cloud2gether_logo_1200px.png"
        alt="Cloud2Gether Logo"
        style={{ width: 100, height: 100 }}
      />
      <h1>Cloud2Gether</h1>
      <p>Bienvenue sur Cloud2Gether !</p>
      <button onClick={handleHowItWorks}>How it works?</button>
      <button onClick={handleGetStarted} style={{ marginLeft: "10px" }}>
        Get started
      </button>
    </div>
  );
};

export default MainPage;