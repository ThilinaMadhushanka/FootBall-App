import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

export interface SeasonOption { id: number; name: string; is_active: boolean; competition_id: number; }
export interface CompetitionOption { id: number; name: string; code: string; type: string; region: string; seasons?: SeasonOption[]; }

interface CompetitionContextValue {
  competitions: CompetitionOption[];
  selectedCompetition?: CompetitionOption;
  selectedSeason?: SeasonOption;
  selectedSeasonID: number | null;
  loading: boolean;
  selectSeason: (seasonID: number) => void;
}

const CompetitionContext = createContext<CompetitionContextValue | undefined>(undefined);

export const CompetitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);
  const [selectedSeasonID, setSelectedSeasonID] = useState<number | null>(() => {
    const stored = Number(localStorage.getItem('selectedSeasonID'));
    return stored > 0 ? stored : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompetitions = () => {
      if (!localStorage.getItem('token')) { setLoading(false); return; }
      setLoading(true);
      api.get('/competitions').then(response => {
      const options = Array.isArray(response.data) ? response.data : [];
      setCompetitions(options);
      const allSeasons: SeasonOption[] = options.flatMap((competition: CompetitionOption) => competition.seasons || []);
      const storedIsValid = allSeasons.some(season => season.id === selectedSeasonID);
      if (!storedIsValid) {
        const preferredCompetition = options.find((competition: CompetitionOption) => competition.code === 'EPL') || options[0];
        const defaultSeason = preferredCompetition?.seasons?.find((season: SeasonOption) => season.is_active) || preferredCompetition?.seasons?.[0];
        if (defaultSeason) setSelectedSeasonID(defaultSeason.id);
      }
      }).finally(() => setLoading(false));
    };
    loadCompetitions();
    window.addEventListener('auth-changed', loadCompetitions);
    return () => window.removeEventListener('auth-changed', loadCompetitions);
  }, []);

  const selectSeason = (seasonID: number) => {
    setSelectedSeasonID(seasonID);
    localStorage.setItem('selectedSeasonID', String(seasonID));
  };
  const selectedCompetition = competitions.find(competition => competition.seasons?.some(season => season.id === selectedSeasonID));
  const selectedSeason = selectedCompetition?.seasons?.find(season => season.id === selectedSeasonID);
  const value = useMemo(() => ({ competitions, selectedCompetition, selectedSeason, selectedSeasonID, loading, selectSeason }), [competitions, selectedCompetition, selectedSeason, selectedSeasonID, loading]);
  return <CompetitionContext.Provider value={value}>{children}</CompetitionContext.Provider>;
};

export const useCompetition = () => {
  const value = useContext(CompetitionContext);
  if (!value) throw new Error('useCompetition must be used inside CompetitionProvider');
  return value;
};
