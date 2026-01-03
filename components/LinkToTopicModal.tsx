import React from 'react';
import { type ReviewCard, type FrameworkTopic } from '../types';

interface LinkToTopicModalProps {
  card: ReviewCard;
  topics: FrameworkTopic[];
  isOpen: boolean;
  onClose: () => void;
  onLink: (cardId: string, topicId: string) => void;
}

// Recursive sub-component to render the topic tree
const TopicTree: React.FC<{
  allTopics: FrameworkTopic[];
  parentId: string | undefined;
  onSelect: (topicId: string) => void;
}> = ({ allTopics, parentId, onSelect }) => {
  const children = allTopics.filter(topic => topic.parentId === parentId);

  if (children.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-1">
      {children.map(topic => (
        <li key={topic.id} style={{ paddingLeft: `${topic.level * 16}px` }}>
          <button
            onClick={() => onSelect(topic.id)}
            className="w-full text-left p-2 rounded-md hover:bg-indigo-100 text-slate-700 transition-colors"
          >
            {topic.title}
          </button>
          <TopicTree allTopics={allTopics} parentId={topic.id} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
};


const LinkToTopicModal: React.FC<LinkToTopicModalProps> = ({ card, topics, isOpen, onClose, onLink }) => {
  if (!isOpen) return null;

  const rootTopics = topics.filter(t => !t.parentId);

  const handleSelectTopic = (topicId: string) => {
    onLink(card.id, topicId);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="link-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-5 border-b border-slate-200">
          <h2 id="link-modal-title" className="text-xl font-bold text-slate-800">Vincular Ficha a un Tema</h2>
          <p className="text-sm text-slate-600 mt-1">
            Selecciona el tema del marco teórico al que quieres vincular la ficha: <span className="font-semibold text-indigo-700">"{card.source}"</span>
          </p>
        </div>

        <div className="p-5 overflow-y-auto">
          {rootTopics.map(topic => (
            <div key={topic.id} className="mb-2">
              <button
                onClick={() => handleSelectTopic(topic.id)}
                className="w-full text-left p-2 rounded-md hover:bg-indigo-100 text-slate-800 font-bold transition-colors"
              >
                {topic.title}
              </button>
              <TopicTree allTopics={topics} parentId={topic.id} onSelect={handleSelectTopic} />
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkToTopicModal;
