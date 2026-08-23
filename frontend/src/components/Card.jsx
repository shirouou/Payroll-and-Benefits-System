import React from 'react';
import '../styles/Card.css';

export const Card = ({ title, children, className = '', icon, action }) => {
  return (
    <div className={`card ${className}`}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">
            {icon && <span className="card-icon">{icon}</span>}
            {title}
          </h3>
          {action && <div className="card-action">{action}</div>}
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

export default Card;
