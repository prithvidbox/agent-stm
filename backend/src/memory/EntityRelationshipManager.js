export class EntityRelationshipManager {
  constructor() {
    this.relationshipTypes = {
      PERSON_ROLE: 'person_role',
      PERSON_DEPARTMENT: 'person_department',
      ROLE_DEPARTMENT: 'role_department',
      PERSON_COMPANY: 'person_company',
      CORRECTION: 'correction'
    };
  }

  // Extract relationships from message entities
  extractRelationships(messageData, existingEntities = new Map()) {
    const relationships = [];
    const entities = messageData.entities;
    const content = messageData.content.toLowerCase();

    // Find person entities
    const persons = entities.filter(e => e.type === 'name');
    
    for (const person of persons) {
      // Look for role/job relationships
      const roleKeywords = ['manager', 'director', 'engineer', 'scientist', 'analyst', 'developer', 'lead', 'coordinator'];
      const departmentKeywords = ['sales', 'marketing', 'engineering', 'data', 'finance', 'hr', 'operations', 'product'];
      const companyKeywords = ['google', 'microsoft', 'apple', 'amazon', 'facebook', 'netflix', 'uber', 'airbnb'];

      // Extract role relationships
      roleKeywords.forEach(role => {
        if (content.includes(role)) {
          relationships.push({
            from: person.value,
            to: role,
            type: this.relationshipTypes.PERSON_ROLE,
            confidence: this.calculateRelationshipConfidence(content, person.value, role),
            timestamp: messageData.timestamp,
            messageId: messageData.id
          });
        }
      });

      // Extract department relationships
      departmentKeywords.forEach(dept => {
        if (content.includes(dept)) {
          relationships.push({
            from: person.value,
            to: dept,
            type: this.relationshipTypes.PERSON_DEPARTMENT,
            confidence: this.calculateRelationshipConfidence(content, person.value, dept),
            timestamp: messageData.timestamp,
            messageId: messageData.id
          });
        }
      });

      // Extract company relationships
      companyKeywords.forEach(company => {
        if (content.includes(company)) {
          relationships.push({
            from: person.value,
            to: company,
            type: this.relationshipTypes.PERSON_COMPANY,
            confidence: this.calculateRelationshipConfidence(content, person.value, company),
            timestamp: messageData.timestamp,
            messageId: messageData.id
          });
        }
      });
    }

    return relationships;
  }

  // Calculate confidence for relationship extraction
  calculateRelationshipConfidence(content, entity1, entity2) {
    let confidence = 0.5;
    
    // Check for explicit relationship indicators
    const strongIndicators = ['is a', 'works as', 'is the', 'manager of', 'at'];
    const mediumIndicators = ['in', 'with', 'for'];
    
    if (strongIndicators.some(indicator => content.includes(indicator))) {
      confidence = 0.9;
    } else if (mediumIndicators.some(indicator => content.includes(indicator))) {
      confidence = 0.7;
    }

    // Proximity bonus - if entities are close together in text
    const entity1Index = content.indexOf(entity1.toLowerCase());
    const entity2Index = content.indexOf(entity2.toLowerCase());
    
    if (entity1Index !== -1 && entity2Index !== -1) {
      const distance = Math.abs(entity1Index - entity2Index);
      if (distance < 20) confidence += 0.2;
      else if (distance < 50) confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // Update entity relationship graph
  updateEntityGraph(entityGraph, relationships) {
    relationships.forEach(rel => {
      const key = `${rel.from}:${rel.to}:${rel.type}`;
      
      if (entityGraph.has(key)) {
        // Update existing relationship
        const existing = entityGraph.get(key);
        existing.confidence = Math.max(existing.confidence, rel.confidence);
        existing.lastUpdated = rel.timestamp;
        existing.updateCount = (existing.updateCount || 1) + 1;
      } else {
        // Create new relationship
        entityGraph.set(key, {
          ...rel,
          lastUpdated: rel.timestamp,
          updateCount: 1,
          active: true
        });
      }
    });
  }

  // Handle relationship corrections
  handleRelationshipCorrection(entityGraph, correction) {
    const { entity, oldValue, newValue, confidence, timestamp } = correction;
    
    // Find relationships to update
    const relationsToUpdate = [];
    
    for (const [key, relationship] of entityGraph.entries()) {
      if (relationship.from === entity || relationship.to === entity) {
        if (relationship.to === oldValue) {
          // This relationship needs to be corrected
          relationsToUpdate.push({
            oldKey: key,
            relationship: relationship,
            newTo: newValue
          });
        }
      }
    }

    // Apply corrections
    relationsToUpdate.forEach(update => {
      // Mark old relationship as corrected
      const oldRel = entityGraph.get(update.oldKey);
      oldRel.corrected = true;
      oldRel.correctedAt = timestamp;
      oldRel.active = false;

      // Create new corrected relationship
      const newKey = update.oldKey.replace(oldValue, newValue);
      entityGraph.set(newKey, {
        ...oldRel,
        to: update.newTo,
        confidence: Math.max(oldRel.confidence, confidence),
        corrected: false,
        correctionOf: update.oldKey,
        lastUpdated: timestamp,
        active: true
      });
    });
  }

  // Get current state of an entity
  getEntityCurrentState(entityGraph, entityName) {
    const currentState = {
      name: entityName,
      roles: [],
      departments: [],
      companies: [],
      lastUpdated: null
    };

    for (const [key, relationship] of entityGraph.entries()) {
      if (relationship.from === entityName && relationship.active) {
        switch (relationship.type) {
          case this.relationshipTypes.PERSON_ROLE:
            currentState.roles.push({
              value: relationship.to,
              confidence: relationship.confidence,
              lastUpdated: relationship.lastUpdated
            });
            break;
          case this.relationshipTypes.PERSON_DEPARTMENT:
            currentState.departments.push({
              value: relationship.to,
              confidence: relationship.confidence,
              lastUpdated: relationship.lastUpdated
            });
            break;
          case this.relationshipTypes.PERSON_COMPANY:
            currentState.companies.push({
              value: relationship.to,
              confidence: relationship.confidence,
              lastUpdated: relationship.lastUpdated
            });
            break;
        }
        
        if (!currentState.lastUpdated || relationship.lastUpdated > currentState.lastUpdated) {
          currentState.lastUpdated = relationship.lastUpdated;
        }
      }
    }

    // Sort by confidence and recency
    ['roles', 'departments', 'companies'].forEach(category => {
      currentState[category].sort((a, b) => {
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
        return b.lastUpdated - a.lastUpdated;
      });
    });

    return currentState;
  }

  // Get relationship history for an entity
  getEntityHistory(entityGraph, entityName) {
    const history = [];
    
    for (const [key, relationship] of entityGraph.entries()) {
      if (relationship.from === entityName) {
        history.push({
          type: relationship.type,
          value: relationship.to,
          confidence: relationship.confidence,
          timestamp: relationship.timestamp,
          lastUpdated: relationship.lastUpdated,
          active: relationship.active,
          corrected: relationship.corrected || false,
          correctionOf: relationship.correctionOf
        });
      }
    }

    return history.sort((a, b) => b.lastUpdated - a.lastUpdated);
  }

  // Export relationship graph for analysis
  exportRelationshipGraph(entityGraph) {
    const exported = {
      relationships: [],
      entities: new Set(),
      statistics: {
        totalRelationships: entityGraph.size,
        activeRelationships: 0,
        correctedRelationships: 0
      }
    };

    for (const [key, relationship] of entityGraph.entries()) {
      exported.relationships.push({
        key,
        ...relationship
      });
      
      exported.entities.add(relationship.from);
      exported.entities.add(relationship.to);
      
      if (relationship.active) exported.statistics.activeRelationships++;
      if (relationship.corrected) exported.statistics.correctedRelationships++;
    }

    exported.entities = Array.from(exported.entities);
    return exported;
  }
}
