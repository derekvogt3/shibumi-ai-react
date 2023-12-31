import { useEffect, useRef, useState } from 'react';
import { Button, TextField, Container, Paper, Typography, CircularProgress, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

type Message = {
  type: 'user' | 'bot';
  content: string;
  docs?: Document[]
};

interface Document{
  id: string,
  source: string,
  title: string
  content: string,
  tags: string[]
}

function sendChat(query: string, conversation: string): Promise<any> {
  // Define the endpoint URL
  const apiUrl = 'https://flask-production-c8257.up.railway.app';
  // const apiUrl = 'http://127.0.0.1:5000';
  const body = JSON.stringify({ query: query, conversation: conversation })
  // Send the POST request 
  return fetch(apiUrl, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: body  // Convert the query object to JSON string
  })
  .then(response => {
      // Check if the request was successful
      if (!response.ok) {
          throw new Error('Network response was not ok');
      }
      return response.json();  // Parse the response body as JSON
  });
}

function removeDuplicateDocuments(docs: Document[]): Document[] {
  const seen = new Set<string>();
  return docs
    .filter(doc => !doc.source.includes("?post_type="))
    .filter(doc => {
      if (seen.has(doc.source)) {
        return false;
      }
      seen.add(doc.source);
      return true;
    });
}


export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = () => {
    setIsLoading(true);
    if (input.trim()) {
      let conversation = messages.length > 4 ? [...messages].slice(-5) : [...messages]
      setMessages([...messages, { type: 'user', content: input.trim() }]);
      sendChat(input, JSON.stringify(conversation))
        .then(data => {
          const botMessage = data.message;
          const documents = data.documents
          setIsLoading(false);
          setMessages(prevMessages => [...prevMessages, { type: 'bot', content: botMessage, docs: removeDuplicateDocuments(documents) }]);  
        })
        .catch(error => {
          setIsLoading(false);
          setMessages(prevMessages => [...prevMessages, { type: 'bot', content: 'There was a problem with the fetch operation:' + error.message }]);
        });

      setInput('');
    }

  };

  useEffect(() => {
    if (chatContainerRef.current) {
      const scrollHeight = chatContainerRef.current.scrollHeight;
      chatContainerRef.current.scrollTop = scrollHeight;
    }
  }, [messages]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Demo Shibumi Chatbot
      </Typography>
      <Paper 
        elevation={3} 
        ref={chatContainerRef} // Attach the ref here
        style={{ height: '500px', width: '90%', overflowY: 'auto', padding: '20px' }}
      >
      {messages.map((message, index) => (
        <div 
          key={index} 
          style={{
            display: 'flex',
            justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '10px'
          }}
        >
          <Stack>
            <Typography 
              align="left" 
              style={{ 
                whiteSpace: 'pre-line',
                padding: '10px 15px',
                borderRadius: '20px',
                background: message.type === 'user' ? '#0f7adf' : '#e5e5ea',
                color: message.type === 'user' ? 'white' : 'black',
                maxWidth: '70%',
                wordBreak: 'break-word'
              }}
            >
              {message.content}
            </Typography>

            {message.docs && message.docs.length > 0 && (
              <>
                <Typography 
                  style={{ 
                    fontSize: 'smaller',
                    marginLeft: '10px',
                    fontWeight: 'bold'
                  }}
                >
                  Sources:
                </Typography>

                {message.docs.map(doc => (
                  <a key={doc.id} href={doc.source} target="_blank" rel="noopener noreferrer">
                    <Typography 
                      style={{ 
                        fontSize: 'smaller',
                        marginLeft: '10px'
                      }}
                    >
                      {doc.title}
                    </Typography>
                  </a>
                ))}
              </>
            )}
          </Stack>
        </div>
      ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', padding: '10px 15px' }}>
            <CircularProgress size={20} />
          </div>
        )}
      </Paper>
      <div style={{ display: 'flex', marginTop: '20px' }}>
        <TextField
          variant="outlined"
          fullWidth
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ marginRight: '10px' }}
        />
        <Button variant="contained" color="primary" endIcon={<SendIcon />} onClick={handleSendMessage}>
          Send
        </Button>
      </div>
    </Container>
  );
}

