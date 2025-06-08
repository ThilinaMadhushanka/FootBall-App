import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMatchEvents, MatchEvent } from '../utils/api';

const MatchEventsComponent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        if (!id) return;
        const data = await getMatchEvents(parseInt(id));
        setEvents(data);
      } catch (err) {
        setError('Failed to load match events');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [id]);

  const getEventIcon = (eventType: MatchEvent['event_type']) => {
    switch (eventType) {
      case 'goal':
        return '⚽';
      case 'assist':
        return '🎯';
      case 'yellow_card':
        return '🟨';
      case 'red_card':
        return '🟥';
      case 'substitution':
        return '🔄';
      case 'injury':
        return '🏥';
      default:
        return '•';
    }
  };

  const getEventColor = (eventType: MatchEvent['event_type']) => {
    switch (eventType) {
      case 'goal':
        return 'bg-green-100 text-green-800';
      case 'assist':
        return 'bg-blue-100 text-blue-800';
      case 'yellow_card':
        return 'bg-yellow-100 text-yellow-800';
      case 'red_card':
        return 'bg-red-100 text-red-800';
      case 'substitution':
        return 'bg-purple-100 text-purple-800';
      case 'injury':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No events recorded for this match.
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">Match Events</h2>
      
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={`flex items-center p-4 rounded-lg ${getEventColor(event.event_type)}`}
          >
            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl">
              {getEventIcon(event.event_type)}
            </div>
            
            <div className="ml-4 flex-grow">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{event.event_type.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{event.minute}'</span>
              </div>
              
              <div className="text-sm mt-1">
                <span className="font-medium">{event.team}</span>
                {event.description && (
                  <span className="ml-2 text-gray-600">- {event.description}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-sm text-gray-500">
        Total Events: {events.length}
      </div>
    </div>
  );
};

export default MatchEventsComponent; 