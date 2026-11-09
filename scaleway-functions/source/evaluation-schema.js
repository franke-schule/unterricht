const EVALUATION_SCHEMA = {
  type:
    'object',
  properties: {
    points: {
      type:
        'integer'
    },
    maxPoints: {
      type:
        'integer'
    },
    status: {
      type:
        'string'
    },
    strengths: {
      type:
        'array',
      items: {
        type:
          'string'
      }
    },
    missing: {
      type:
        'array',
      items: {
        type:
          'string'
      }
    },
    feedback: {
      type:
        'string'
    }
  },
  required: [
    'points',
    'maxPoints',
    'status',
    'strengths',
    'missing',
    'feedback'
  ]
};
