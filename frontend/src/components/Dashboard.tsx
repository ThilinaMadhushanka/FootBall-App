import React, { useState, useEffect } from "react";
import { Clock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useCompetition } from "../context/CompetitionContext";
import ContractCounterModal from "./ContractCounterModal";

interface Player {
  id: number;
  name: string;
  position: string;
  rating: number;
  price: number;
  team: string;
  image: string;
}

interface Match {
  id: number;
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  status: string;
  scoreTeam1: number;
  scoreTeam2: number;
}

const getTeamName = (team: unknown): string => {
  if (typeof team === "string") return team;
  if (team && typeof team === "object" && "name" in team) {
    const name = (team as { name?: unknown }).name;
    return typeof name === "string" ? name : "TBD";
  }
  return "TBD";
};

interface DashboardStats {
  team_members: string;
  remaining_budget: number;
  league_rank: number;
  total_points: number;
}

interface TeamInvitation {
  id: number;
  to_team?: { name?: string; stadium?: string };
}

interface LeaderboardSummary {
  manager_id: number;
  team_id: number;
  total_points: number;
  league_rank: number;
  manager?: { full_name?: string; username?: string };
  team?: { name?: string };
}
interface ContractOffer {
  id: number;
  status: string;
  transfer_fee: number;
  salary_per_season: number;
  signing_bonus: number;
  contract_months: number;
  expires_at: string;
  message?: string;
  from_team?: { name?: string };
  season?: { name?: string; competition?: { name?: string } };
}

const Dashboard: React.FC = () => {
  const { selectedCompetition, selectedSeason, selectedSeasonID } =
    useCompetition();
  const userType = localStorage.getItem("userType");
  const isManager = userType === "manager";
  const isPlayer = userType === "player";
  const isViewer = userType === "viewer";
  let currentUser: any = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    currentUser = {};
  }
  const [featuredPlayers, setFeaturedPlayers] = useState<Player[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [nextMatch, setNextMatch] = useState<Match | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    team_members: "0/11",
    remaining_budget: 0,
    league_rank: 0,
    total_points: 0,
  });
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSummary[]>([]);
  const [isAvailableForOffers, setIsAvailableForOffers] = useState(
    Boolean(currentUser.is_available),
  );
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [contractOffers, setContractOffers] = useState<ContractOffer[]>([]);
  const [contractMessage, setContractMessage] = useState("");
  const [counterOffer, setCounterOffer] = useState<ContractOffer | null>(null);

  const navigate = useNavigate();

  const toggleOfferAvailability = async () => {
    const nextValue = !isAvailableForOffers;
    setAvailabilitySaving(true);
    setAvailabilityError("");

    try {
      const response = await api.put("/profile", { is_available: nextValue });
      setIsAvailableForOffers(nextValue);
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          ...(response.data || {}),
          is_available: nextValue,
        }),
      );
    } catch (error: any) {
      setAvailabilityError(
        error.response?.data?.error || "Could not update offer availability.",
      );
    } finally {
      setAvailabilitySaving(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch players
        const playersResponse = await api.get("/players");
        setFeaturedPlayers(
          playersResponse.data.slice(0, 3).map((player: any) => ({
            id: player.id,
            name: player.full_name || "Unknown Player",
            position: player.position || "Unknown Position",
            rating: player.rating || 0,
            price: player.price || 0,
            team: player.current_team ? player.current_team.name : "No Team",
            image: player.profile_image_url || "/api/placeholder/80/80",
          })),
        );

        // Fetch matches
        const matchesResponse = await api.get("/matches/upcoming", {
          params: selectedSeasonID ? { season_id: selectedSeasonID } : {},
        });
        setUpcomingMatches(
          matchesResponse.data.slice(0, 2).map((match: any) => ({
            id: match.id,
            team1: getTeamName(match.team1),
            team2: getTeamName(match.team2),
            date: match.match_date || "TBD",
            time: match.match_time || "TBD",
            venue: match.venue || "Venue TBA",
            status: match.status || "scheduled",
            scoreTeam1: Number(match.score_team1 || 0),
            scoreTeam2: Number(match.score_team2 || 0),
          })),
        );

        const allMatchesResponse = await api.get("/matches", {
          params: selectedSeasonID ? { season_id: selectedSeasonID } : {},
        });
        setLiveMatches(
          (Array.isArray(allMatchesResponse.data)
            ? allMatchesResponse.data
            : []
          )
            .filter((match: any) =>
              ["live", "in_progress"].includes(
                String(match.status || "").toLowerCase(),
              ),
            )
            .map((match: any) => ({
              id: match.id,
              team1: getTeamName(match.team1),
              team2: getTeamName(match.team2),
              date: match.match_date || "TBD",
              time: match.match_time || "TBD",
              venue: match.venue || "Venue TBA",
              status: match.status || "live",
              scoreTeam1: Number(match.score_team1 || 0),
              scoreTeam2: Number(match.score_team2 || 0),
            })),
        );

        if (isManager) {
          const teamsResponse = await api.get("/teams/my-teams");
          const managedTeam = Array.isArray(teamsResponse.data)
            ? teamsResponse.data[0]
            : null;
          if (managedTeam?.id) {
            const squadResponse = await api.get(
              `/teams/${managedTeam.id}/players`,
            );
            setTeamPlayers(
              (Array.isArray(squadResponse.data) ? squadResponse.data : []).map(
                (player: any) => ({
                  id: player.id,
                  name: player.full_name || player.username || "Player",
                  position: player.position || "Unknown",
                  rating: Number(player.rating || 0),
                  price: Number(player.price || 0),
                  team: managedTeam.name || "My Team",
                  image: player.profile_image_url || "/api/placeholder/80/80",
                }),
              ),
            );
          }
        }

        try {
          const nextMatchResponse = await api.get("/dashboard/next-match");
          const match = nextMatchResponse.data;
          setNextMatch({
            id: match.id,
            team1: getTeamName(match.team1),
            team2: getTeamName(match.team2),
            date: match.match_date || "TBD",
            time: match.match_time || "TBD",
            venue: match.venue || "Venue TBA",
            status: match.status || "scheduled",
            scoreTeam1: Number(match.score_team1 || 0),
            scoreTeam2: Number(match.score_team2 || 0),
          });
        } catch {
          setNextMatch(null);
        }

        // Fetch dashboard stats
        const statsResponse = await api.get("/dashboard/stats", {
          params: selectedSeasonID ? { season_id: selectedSeasonID } : {},
        });
        setStats({
          team_members: statsResponse.data.team_members || "0/11",
          remaining_budget: statsResponse.data.remaining_budget || 0,
          league_rank: statsResponse.data.league_rank || 0,
          total_points: statsResponse.data.total_points || 0,
        });

        const leaderboardResponse = await api.get("/leaderboard");
        setLeaderboard(
          Array.isArray(leaderboardResponse.data)
            ? leaderboardResponse.data.slice(0, 3)
            : [],
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
    if (isPlayer) {
      api
        .get("/profile")
        .then((response) =>
          setIsAvailableForOffers(Boolean(response.data?.is_available)),
        )
        .catch(() => undefined);
      api
        .get("/team-requests/player")
        .then((response) =>
          setInvitations(Array.isArray(response.data) ? response.data : []),
        )
        .catch(() => setInvitations([]));
      api
        .get("/contract-offers")
        .then((response) =>
          setContractOffers(Array.isArray(response.data) ? response.data : []),
        )
        .catch(() => setContractOffers([]));
    }
  }, [selectedSeasonID]);

  const respondToInvitation = async (
    requestID: number,
    decision: "accepted" | "rejected",
  ) => {
    await api.put(`/team-requests/${requestID}/respond`, { decision });
    setInvitations((items) => items.filter((item) => item.id !== requestID));
    if (decision === "accepted") window.location.reload();
  };

  const respondToContract = async (
    offer: ContractOffer,
    action: "accept" | "reject",
  ) => {
    try {
      await api.put(`/contract-offers/${offer.id}/respond`, { action });
      setContractMessage(`Offer ${action}ed.`);
      const response = await api.get("/contract-offers");
      setContractOffers(response.data);
    } catch (error: any) {
      setContractMessage(
        error.response?.data?.error || "Could not update offer.",
      );
    }
  };
  const submitPlayerCounter = async (payload: Record<string, unknown>) => {
    if (!counterOffer) return;
    await api.put(`/contract-offers/${counterOffer.id}/respond`, payload);
    setContractMessage("Counter offer sent to manager.");
    const response = await api.get("/contract-offers");
    setContractOffers(response.data);
  };

  const handleManageTeam = () => {
    navigate("/my-teams");
  };

  const handleBrowsePlayers = () => {
    navigate("/players");
  };

  const handleAddPlayer = (index: number) => {
    console.log(`Add Player button clicked for slot ${index + 1}!`);
    navigate("/players");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <span className="font-bold text-slate-800">Current competition:</span>
        <span>{selectedCompetition?.name || "All competitions"}</span>
        {selectedSeason && <span>· {selectedSeason.name}</span>}
      </div>
      <div className="mb-7 overflow-hidden rounded-2xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
              {isManager
                ? "Manager Details"
                : isPlayer
                  ? "Player Details"
                  : "Match Details & Stats"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Welcome back,{" "}
              {currentUser.full_name ||
                currentUser.username ||
                (isManager ? "Manager" : isPlayer ? "Player" : "Football Fan")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              {isManager
                ? "Build your squad, manage your budget and prepare for the next fixture."
                : isPlayer
                  ? "Track your performance, view fixtures and follow your league progress."
                  : "Follow live matches, upcoming fixtures, players, teams and performance."}
            </p>
          </div>
          {nextMatch ? (
            (() => {
              const isLive = ["live", "in_progress"].includes(
                nextMatch.status.toLowerCase(),
              );
              return (
                <Link
                  to={`/matches/${nextMatch.id}/events`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.06] p-5 transition hover:border-emerald-400/40 hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black uppercase tracking-[0.18em] ${isLive ? "text-red-300" : "text-emerald-300"}`}
                    >
                      {isLive ? "Live match" : "Next match"}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${isLive ? "animate-pulse bg-red-500/20 text-red-300" : "bg-emerald-400/15 text-emerald-300"}`}
                    >
                      {isLive ? "● Live" : nextMatch.status}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center">
                    <p className="font-black leading-tight">
                      {nextMatch.team1}
                    </p>
                    <span
                      className={`font-black ${isLive ? "text-2xl text-white" : "text-xs text-slate-500"}`}
                    >
                      {isLive
                        ? `${nextMatch.scoreTeam1} - ${nextMatch.scoreTeam2}`
                        : "VS"}
                    </span>
                    <p className="font-black leading-tight">
                      {nextMatch.team2}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-white/10 pt-3 text-xs text-slate-400">
                    <span>{new Date(nextMatch.date).toLocaleDateString()}</span>
                    <span>{nextMatch.time}</span>
                    <span>{nextMatch.venue}</span>
                    {isLive && (
                      <span className="font-bold text-red-300">
                        View live events →
                      </span>
                    )}
                  </div>
                </Link>
              );
            })()
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-5 text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
                Next match
              </p>
              <p className="mt-3 text-sm text-slate-400">
                No upcoming fixture scheduled.
              </p>
            </div>
          )}
        </div>
      </div>

      {isPlayer && invitations.length > 0 && (
        <section className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h2 className="text-lg font-black text-slate-900">
            Team invitations
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Managers have invited you to join their squads.
          </p>
          <div className="mt-4 space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold">
                    {invitation.to_team?.name || "Football Team"}
                  </p>
                  <p className="text-sm text-slate-500">
                    {invitation.to_team?.stadium || "Team invitation"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      respondToInvitation(invitation.id, "rejected")
                    }
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() =>
                      respondToInvitation(invitation.id, "accepted")
                    }
                    className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950"
                  >
                    Accept & join
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {isPlayer &&
        contractOffers.some((offer) => offer.status === "pending_player") && (
          <section className="mb-7 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Contract offers
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Accept, reject or suggest your preferred salary and contract
                  period.
                </p>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                Negotiation
              </span>
            </div>
            {contractMessage && (
              <p className="mt-3 text-sm font-semibold text-indigo-700">
                {contractMessage}
              </p>
            )}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {contractOffers
                .filter((offer) => offer.status === "pending_player")
                .map((offer) => (
                  <div
                    key={offer.id}
                    className="rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="font-black">
                          {offer.from_team?.name || "Team offer"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {offer.season?.competition?.name} ·{" "}
                          {offer.season?.name}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        Expires{" "}
                        {new Date(offer.expires_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <p>
                        Transfer fee
                        <br />
                        <strong>₹{offer.transfer_fee.toLocaleString()}</strong>
                      </p>
                      <p>
                        Salary / season
                        <br />
                        <strong>
                          ₹{offer.salary_per_season.toLocaleString()}
                        </strong>
                      </p>
                      <p>
                        Signing bonus
                        <br />
                        <strong>₹{offer.signing_bonus.toLocaleString()}</strong>
                      </p>
                      <p>
                        Contract
                        <br />
                        <strong>{offer.contract_months} months</strong>
                      </p>
                    </div>
                    {offer.message && (
                      <p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                        {offer.message}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => respondToContract(offer, "accept")}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-bold"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => setCounterOffer(offer)}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white"
                      >
                        Suggest changes
                      </button>
                      <button
                        onClick={() => respondToContract(offer, "reject")}
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-bold text-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">
              {isManager
                ? "Team Members"
                : isPlayer
                  ? "Games Played"
                  : "Featured Players"}
            </p>
            <p className="text-xl font-bold">
              {isManager
                ? stats.team_members
                : isPlayer
                  ? currentUser.games_played || 0
                  : featuredPlayers.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">
              {isManager
                ? "Remaining Budget"
                : isPlayer
                  ? "Goals"
                  : "Upcoming Matches"}
            </p>
            <p className="text-xl font-bold">
              {isManager
                ? `₹${stats.remaining_budget}`
                : isPlayer
                  ? currentUser.goals || 0
                  : upcomingMatches.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">
              {isManager ? "League Rank" : isPlayer ? "Assists" : "Top Teams"}
            </p>
            <p className="text-xl font-bold">
              {isManager
                ? `#${stats.league_rank}`
                : isPlayer
                  ? currentUser.assists || 0
                  : leaderboard.length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow flex items-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"
              />
            </svg>
          </div>
          <div>
            <p className="text-gray-500 text-sm">
              {isManager
                ? "Total Points"
                : isPlayer
                  ? "Player Rating"
                  : "Account Mode"}
            </p>
            <p className="text-xl font-bold">
              {isManager
                ? stats.total_points
                : isPlayer
                  ? currentUser.rating || 0
                  : "Viewer"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {/* Featured Players */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Featured Players</h2>
              <Link to="/players" className="text-blue-600 hover:underline">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-4 p-2 rounded-lg border border-gray-200"
                >
                  <img
                    src={player.image}
                    alt={player.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-bold">{player.name}</p>
                    <p className="text-sm text-gray-600">
                      {player.position} - {player.team}
                    </p>
                    <p className="text-sm text-gray-800">
                      Rating: {player.rating}
                    </p>
                    <p className="text-sm text-green-600">₹{player.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Team */}
          {isManager ? (
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Team</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400"
                    onClick={handleManageTeam}
                  >
                    Manage Teams
                  </button>
                  <button
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-emerald-700"
                    onClick={handleBrowsePlayers}
                  >
                    Browse Players
                  </button>
                </div>
              </div>
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                <strong>How to add:</strong> Select an empty slot or click{" "}
                <strong>Browse Players</strong>, then send an
                invitation/transfer request. The player appears here after
                accepting it.
              </div>
              <div className="max-h-[592px] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(24)].map((_, index) => {
                    const player = teamPlayers[index];
                    return player ? (
                      <Link
                        key={player.id}
                        to={`/players/${player.id}/stats`}
                        className="flex h-32 flex-col items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 p-4 transition hover:border-emerald-500"
                      >
                        <img
                          src={player.image}
                          alt=""
                          className="mb-2 h-10 w-10 rounded-full object-cover"
                        />
                        <p className="font-bold text-slate-900">
                          {player.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {player.position} · Rating {player.rating}
                        </p>
                      </Link>
                    ) : (
                      <button
                        key={`slot-${index}`}
                        type="button"
                        className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-4 transition-colors hover:border-blue-500"
                        onClick={() => handleAddPlayer(index)}
                      >
                        <svg
                          className="mb-2 h-10 w-10 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM12 14c-1.474 0-2.836.278-4 .775V21h8v-6.225c-1.164-.497-2.526-.775-4-.775z"
                          />
                        </svg>
                        <span className="text-sm text-gray-500">
                          Add Player #{index + 1}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : isPlayer ? (
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-6 text-white shadow-lg">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-950/70">
                Player profile
              </p>
              <h2 className="mt-2 text-2xl font-black">
                {currentUser.position || "Football Player"}
              </h2>
              <p className="mt-2 text-sm text-emerald-950/80">
                View your personal information, current team and performance
                statistics.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate("/profile")}
                  className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  View My Profile
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAvailableForOffers}
                  disabled={availabilitySaving}
                  onClick={toggleOfferAvailability}
                  className="rounded-lg border border-white/50 bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25 disabled:cursor-wait disabled:opacity-60"
                >
                  {availabilitySaving
                    ? "Saving..."
                    : isAvailableForOffers
                      ? "Pause Offers"
                      : "Enable Offers"}
                </button>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${isAvailableForOffers ? "bg-white text-emerald-700" : "bg-emerald-950/30 text-white"}`}
                >
                  {isAvailableForOffers
                    ? "Accepting offers"
                    : "Not accepting offers"}
                </span>
              </div>
              {availabilityError && (
                <p className="mt-3 text-sm font-semibold text-red-950">
                  {availabilityError}
                </p>
              )}
            </div>
          ) : isViewer ? (
            <div className="mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
              <p className="text-sm font-bold uppercase tracking-wider text-blue-100">
                Viewer access
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Explore the football world
              </h2>
              <p className="mt-2 text-sm text-blue-100">
                Open team profiles, compare performance, inspect player
                statistics and follow every fixture.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/players")}
                  className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-blue-700"
                >
                  Browse Players
                </button>
                <button
                  onClick={() => navigate("/leaderboard")}
                  className="rounded-lg border border-white/40 px-4 py-2 text-sm font-bold text-white"
                >
                  Browse Teams
                </button>
                <button
                  onClick={() => navigate("/fixtures")}
                  className="rounded-lg border border-white/40 px-4 py-2 text-sm font-bold text-white"
                >
                  Match Centre
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 rounded-2xl bg-slate-100 p-6 text-slate-700">
              Select a valid account role.
            </div>
          )}
        </div>

        <div>
          <div className="mb-6 rounded-lg bg-slate-950 p-4 text-white shadow">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Live Matches</h2>
              <span className="rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-bold text-red-300">
                LIVE
              </span>
            </div>
            {liveMatches.length === 0 ? (
              <p className="rounded-lg border border-dashed border-white/15 p-4 text-center text-sm text-slate-400">
                No matches are live right now.
              </p>
            ) : (
              <div className="space-y-3">
                {liveMatches.map((match) => (
                  <Link
                    key={match.id}
                    to={`/matches/${match.id}/events`}
                    className="block rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-red-400/40 hover:bg-white/10"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase text-red-300">
                        Live now
                      </span>
                      <span className="text-xs text-slate-400">
                        {match.venue}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                      <span className="text-sm font-bold">{match.team1}</span>
                      <span className="rounded-lg bg-white/10 px-3 py-1 text-lg font-black">
                        {match.scoreTeam1} - {match.scoreTeam2}
                      </span>
                      <span className="text-sm font-bold">{match.team2}</span>
                    </div>
                    <p className="mt-2 text-center text-xs font-semibold text-red-300">
                      Open live details
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Matches */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upcoming Matches</h2>
              <Link to="/fixtures" className="text-blue-600 hover:underline">
                View Calendar
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="border border-gray-200 p-3 rounded-lg"
                >
                  <p className="font-bold">
                    {match.team1} vs {match.team2}
                  </p>
                  <p className="text-sm text-gray-600">
                    {match.date} at {match.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Leaderboard */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Top Leaderboard</h2>
              <Link to="/leaderboard" className="text-blue-600 hover:underline">
                Full Rankings
              </Link>
            </div>
            <ul className="space-y-3">
              {leaderboard.length === 0 ? (
                <li className="py-4 text-center text-sm text-slate-500">
                  No leaderboard data
                </li>
              ) : (
                leaderboard.map((entry, index) => (
                  <li key={`${entry.manager_id}-${entry.team_id}`}>
                    <Link
                      to={`/teams/${entry.team_id}/details`}
                      className="flex items-center justify-between rounded-lg p-2 transition hover:bg-emerald-50"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-lg font-bold ${index === 0 ? "text-yellow-500" : index === 1 ? "text-slate-400" : "text-orange-400"}`}
                        >
                          {entry.league_rank || index + 1}
                        </span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                          <User className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <span className="block text-sm font-bold">
                            {entry.team?.name || "Unknown team"}
                          </span>
                          <span className="block text-xs text-slate-400">
                            {entry.manager?.full_name ||
                              entry.manager?.username ||
                              `Manager #${entry.manager_id}`}
                          </span>
                        </div>
                      </div>
                      <span className="font-bold">{entry.total_points}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
            {/* Recent Activity */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-xl font-bold mb-4">Recent Matches</h2>
              <div className="space-y-3">
                {upcomingMatches.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No match data available.
                  </p>
                ) : (
                  upcomingMatches.map((match) => (
                    <Link
                      key={match.id}
                      to={`/matches/${match.id}/events`}
                      className="flex items-start space-x-3 rounded-lg p-2 transition hover:bg-slate-50"
                    >
                      <Clock className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {match.team1} vs {match.team2}
                        </p>
                        <p className="text-xs text-slate-500">
                          {match.date} at {match.time}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {counterOffer && (
        <ContractCounterModal
          offer={counterOffer}
          actor="player"
          onClose={() => setCounterOffer(null)}
          onSubmit={submitPlayerCounter}
        />
      )}
    </div>
  );
};

export default Dashboard;
