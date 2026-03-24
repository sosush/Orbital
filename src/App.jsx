import { useRef } from 'react';
import { useSatellites } from './hooks/useSatellites';
import LoadingScreen from './components/LoadingScreen';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Globe3D from './components/Globe3D';
import SatelliteDetail from './components/SatelliteDetail';
import BottomBar from './components/BottomBar';

export default function App() {
  const {
    satellites,
    totalCount,
    selectedSatellite,
    selectSatellite,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    loading,
    error,
    categories,
  } = useSatellites();

  const recenterRef = useRef(null);

  const handleRecenter = () => {
    recenterRef.current?.();
  };

  const handleTrack = () => {
    recenterRef.current?.();
  };

  return (
    <>
      <LoadingScreen loading={loading} />

      <div className={`app${selectedSatellite ? ' has-detail' : ''}`}>
        <TopBar
          satelliteCount={totalCount}
          isConnected={!error && !loading}
        />

        <Sidebar
          satellites={satellites}
          categories={categories}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSatellite={selectedSatellite}
          onSelectSatellite={selectSatellite}
          totalCount={totalCount}
        />

        <Globe3D
          satellites={satellites}
          selectedSatellite={selectedSatellite}
          onSatelliteClick={selectSatellite}
          onRecenter={recenterRef}
        />

        {selectedSatellite && (
          <SatelliteDetail
            satellite={selectedSatellite}
            onClose={() => selectSatellite(null)}
            onTrack={handleTrack}
          />
        )}

        <BottomBar
          selectedSatellite={selectedSatellite}
          onRecenter={handleRecenter}
        />
      </div>
    </>
  );
}
