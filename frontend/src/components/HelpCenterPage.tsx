import React, { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Getting Started',
    question: 'How do I create my first team?',
    answer: 'To create your first team, navigate to the "Create Team" page. You\'ll have a budget of $1,000,000 to select 11 players. Choose your formation and players carefully, considering their positions and ratings.'
  },
  {
    category: 'Getting Started',
    question: 'What is the scoring system?',
    answer: 'Points are awarded based on player performances in real matches. Different positions earn points differently - for example, goalkeepers get points for clean sheets and saves, while forwards earn points for goals and assists. Check the Rules & Scoring page for full details.'
  },
  {
    category: 'Team Management',
    question: 'How many transfers can I make?',
    answer: 'You can make up to 2 free transfers per week. Any additional transfers will cost you points. Plan your transfers carefully to maximize your team\'s performance.'
  },
  {
    category: 'Team Management',
    question: 'How do I change my team formation?',
    answer: 'You can change your team formation when making transfers. Select a new formation that suits your players\' positions. Remember that you must maintain the minimum requirements for each position.'
  },
  {
    category: 'Matches',
    question: 'When are matches played?',
    answer: 'Matches are played weekly, with points calculated based on your players\' performances in real-world matches. Your team automatically competes against other managers\' teams.'
  },
  {
    category: 'Matches',
    question: 'How is the winner determined?',
    answer: 'The winner is determined by the total points scored by your players in their real matches. Points are awarded for goals, assists, clean sheets, and other performances as per the scoring system.'
  },
  {
    category: 'Technical',
    question: 'What should I do if I can\'t log in?',
    answer: 'If you\'re having trouble logging in, try resetting your password. If the issue persists, contact our support team through the contact form below.'
  },
  {
    category: 'Technical',
    question: 'How do I update my profile settings?',
    answer: 'You can update your profile settings, including notifications and preferences, in the Settings page. Changes are saved automatically.'
  }
];

const HelpCenterPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(faqs.map(faq => faq.category)))];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Help Center</h1>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-4">
          {filteredFaqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
                <span className="ml-4 px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full">
                  {faq.category}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-4">
            If you couldn't find the answer you were looking for, our support team is here to help.
          </p>
          <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage; 