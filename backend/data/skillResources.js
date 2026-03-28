    // YouTube links and course mappings for each skill
const skillResources = {
  // ─── Full Stack ──────────────────────────────────────────────────────────
  'React': {
    youtube: [
      { title: 'React Full Course for Beginners', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=bMknfKXIFA8' },
      { title: 'React JS Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=w7ejDZ8SWv8' },
    ],
    searchQuery: 'React',
  },
  'Next.js': {
    youtube: [
      { title: 'Next.js 14 Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=ZVnjOPwW4ZA' },
      { title: 'Next.js Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=mTz0GXj8NN0' },
    ],
    searchQuery: 'Next.js',
  },
  'Tailwind CSS': {
    youtube: [
      { title: 'Tailwind CSS Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=ft30zcMlFao' },
      { title: 'Tailwind CSS Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=UBOj6rqRUME' },
    ],
    searchQuery: 'Tailwind CSS',
  },
  'TypeScript': {
    youtube: [
      { title: 'TypeScript Full Course for Beginners', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=30LWjhZzg50' },
      { title: 'TypeScript Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=BCg4U1FzODs' },
    ],
    searchQuery: 'TypeScript',
  },
  'JavaScript': {
    youtube: [
      { title: 'JavaScript Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg' },
      { title: 'JavaScript Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=hdI2bqOjy3c' },
    ],
    searchQuery: 'JavaScript',
  },
  'HTML/CSS': {
    youtube: [
      { title: 'HTML & CSS Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=mU6anWqZJcc' },
      { title: 'HTML Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=UB1O30fR-EE' },
    ],
    searchQuery: 'HTML CSS',
  },
  'Node.js': {
    youtube: [
      { title: 'Node.js Full Course for Beginners', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=f2EqECiTBL8' },
      { title: 'Node.js Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=fBNz5xF-Kx4' },
    ],
    searchQuery: 'Node.js',
  },
  'Express': {
    youtube: [
      { title: 'Express JS Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=Oe421EPjeBE' },
      { title: 'Express Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=L72fhGm1tfE' },
    ],
    searchQuery: 'Express.js',
  },
  'MongoDB': {
    youtube: [
      { title: 'MongoDB Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=ExcRbA7fy_A' },
      { title: 'MongoDB Crash Course', channel: 'Web Dev Simplified', url: 'https://www.youtube.com/watch?v=ofme2o29ngU' },
    ],
    searchQuery: 'MongoDB',
  },
  'PostgreSQL': {
    youtube: [
      { title: 'PostgreSQL Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=qw--VYLpxG4' },
      { title: 'PostgreSQL Tutorial', channel: 'Amigoscode', url: 'https://www.youtube.com/watch?v=5hzZtqCNQKk' },
    ],
    searchQuery: 'PostgreSQL',
  },
  'REST API': {
    youtube: [
      { title: 'REST API Design Best Practices', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=_YlYuNMTCc8' },
      { title: 'REST API Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=Q-BpqyOT3a8' },
    ],
    searchQuery: 'REST API',
  },
  'GraphQL': {
    youtube: [
      { title: 'GraphQL Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=ed8SzALpx1Q' },
      { title: 'GraphQL Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=ZQL7tL2S0oQ' },
    ],
    searchQuery: 'GraphQL',
  },
  'JWT': {
    youtube: [
      { title: 'JWT Authentication Tutorial', channel: 'Web Dev Simplified', url: 'https://www.youtube.com/watch?v=7Q17ubqLfaM' },
      { title: 'JWT Full Guide', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=UBUNrFtufWo' },
    ],
    searchQuery: 'JWT Authentication',
  },
  'Docker': {
    youtube: [
      { title: 'Docker Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo' },
      { title: 'Docker Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=Kyx2PkgBknM' },
    ],
    searchQuery: 'Docker',
  },
  'Git': {
    youtube: [
      { title: 'Git & GitHub Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=RGOj5yH7evk' },
      { title: 'Git Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=SWYqp7iY_Tc' },
    ],
    searchQuery: 'Git GitHub',
  },

  // ─── AI/ML ───────────────────────────────────────────────────────────────
  'Python': {
    youtube: [
      { title: 'Python Full Course for Beginners', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw' },
      { title: 'Python Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=JJmcL1N2KQs' },
    ],
    searchQuery: 'Python',
  },
  'TensorFlow': {
    youtube: [
      { title: 'TensorFlow Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=tPYj3fFJGjk' },
      { title: 'TensorFlow 2.0 Crash Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=6g4O5UOH304' },
    ],
    searchQuery: 'TensorFlow',
  },
  'PyTorch': {
    youtube: [
      { title: 'PyTorch Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=c36lUUr864M' },
      { title: 'PyTorch Crash Course', channel: 'Aladdin Persson', url: 'https://www.youtube.com/watch?v=OIenNRt2bjg' },
    ],
    searchQuery: 'PyTorch',
  },
  'Pandas': {
    youtube: [
      { title: 'Pandas Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=vmEHCJofslg' },
      { title: 'Pandas Crash Course', channel: 'Keith Galli', url: 'https://www.youtube.com/watch?v=2uvysYbKdjM' },
    ],
    searchQuery: 'Pandas Python',
  },
  'NumPy': {
    youtube: [
      { title: 'NumPy Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=QUT1VHiLmmI' },
      { title: 'NumPy Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=9JUAPgtkKpI' },
    ],
    searchQuery: 'NumPy Python',
  },

  // ─── Cloud/DevOps ─────────────────────────────────────────────────────────
  'AWS': {
    youtube: [
      { title: 'AWS Full Course for Beginners', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=ulprqHHWlng' },
      { title: 'AWS Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=ZB5ONbD_SMY' },
    ],
    searchQuery: 'AWS Amazon Web Services',
  },
  'Kubernetes': {
    youtube: [
      { title: 'Kubernetes Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=X48VuDVv0do' },
      { title: 'Kubernetes Crash Course', channel: 'TechWorld with Nana', url: 'https://www.youtube.com/watch?v=s_o8dwzRlu4' },
    ],
    searchQuery: 'Kubernetes',
  },
  'Terraform': {
    youtube: [
      { title: 'Terraform Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=SLB_c_ayRMo' },
      { title: 'Terraform Crash Course', channel: 'TechWorld with Nana', url: 'https://www.youtube.com/watch?v=7xngnjfIlK4' },
    ],
    searchQuery: 'Terraform',
  },

  // ─── Cybersecurity ────────────────────────────────────────────────────────
  'Kali Linux': {
    youtube: [
      { title: 'Kali Linux Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=lZAoFs75_cs' },
      { title: 'Kali Linux for Beginners', channel: 'NetworkChuck', url: 'https://www.youtube.com/watch?v=U1w4T03B30I' },
    ],
    searchQuery: 'Kali Linux',
  },
  'Burp Suite': {
    youtube: [
      { title: 'Burp Suite Full Course', channel: 'TCM Security', url: 'https://www.youtube.com/watch?v=G3hpAeoZ4ek' },
      { title: 'Burp Suite Tutorial', channel: 'David Bombal', url: 'https://www.youtube.com/watch?v=G3hpAeoZ4ek' },
    ],
    searchQuery: 'Burp Suite web security',
  },

  // ─── Data ─────────────────────────────────────────────────────────────────
  'SQL': {
    youtube: [
      { title: 'SQL Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' },
      { title: 'SQL Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=nWeW3sCmD2k' },
    ],
    searchQuery: 'SQL',
  },
  'Power BI': {
    youtube: [
      { title: 'Power BI Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=TmhQCQr_DCA' },
      { title: 'Power BI Tutorial', channel: 'Guy in a Cube', url: 'https://www.youtube.com/watch?v=AGrl-H87pRU' },
    ],
    searchQuery: 'Power BI',
  },

  // ─── Mobile ───────────────────────────────────────────────────────────────
  'React Native': {
    youtube: [
      { title: 'React Native Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc' },
      { title: 'React Native Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=Hf4MJH0jDb4' },
    ],
    searchQuery: 'React Native',
  },
  'Flutter': {
    youtube: [
      { title: 'Flutter Full Course', channel: 'freeCodeCamp', url: 'https://www.youtube.com/watch?v=VPvVD8t02U8' },
      { title: 'Flutter Crash Course', channel: 'Traversy Media', url: 'https://www.youtube.com/watch?v=1gDhl4leEzA' },
    ],
    searchQuery: 'Flutter Dart',
  },
};

// Get resources for a skill (with fallback YouTube search)
const getSkillResources = (skillName) => {
  const exact = skillResources[skillName];
  if (exact) return exact;

  // Fuzzy match
  const key = Object.keys(skillResources).find(k =>
    k.toLowerCase() === skillName.toLowerCase() ||
    skillName.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(skillName.toLowerCase())
  );

  if (key) return skillResources[key];

  // Fallback — YouTube search link
  return {
    youtube: [
      {
        title: `${skillName} Full Course for Beginners`,
        channel: 'YouTube Search',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' full course')}`,
      },
      {
        title: `${skillName} Tutorial`,
        channel: 'YouTube Search',
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial')}`,
      },
    ],
    searchQuery: skillName,
  };
};

module.exports = { skillResources, getSkillResources };