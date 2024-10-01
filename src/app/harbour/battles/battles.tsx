"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Ships } from "../../../../types/battles/airtable";
import { Factory, Book, Link as LucideLink, ArrowLeft, ThumbsUp } from "lucide-react";
import { getSession } from "@/app/utils/auth";
import Link from "next/link";
import Image from "next/image";
import ReactMarkdown, { Components } from "react-markdown";
import { JwtPayload } from 'jsonwebtoken'; 

interface Matchup {
  project1: Ships;
  project2: Ships;
}

interface ProjectCardProps {
  project: Ships;
  onVote: () => void;
  onReadmeClick: () => void;
}


const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onVote,
  onReadmeClick,
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl">
    {project.screenshot_url && (
      <div className="relative h-48 w-full">
        <Image
          src={project.screenshot_url}
          alt={`Screenshot of ${project.title}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover"
        />
      </div>
    )}
    <div className="p-6">
      <h2 className="font-heading text-2xl font-semibold text-indigo-600 dark:text-indigo-300 mb-4">
        {project.title}
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Hours: {project.hours}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {project.repo_url && (
          <Link
            href={project.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200 flex items-center"
          >
            <Factory className="mr-1" /> Repository
          </Link>
        )}
        {project.deploy_url && (
          <Link
            href={project.deploy_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-3 py-1 rounded-full hover:bg-green-200 dark:hover:bg-green-800 transition-colors duration-200 flex items-center"
          >
            <LucideLink className="mr-1" /> Live Demo
          </Link>
        )}
        {project.readme_url && (
          <button
            onClick={onReadmeClick}
            className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-3 py-1 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors duration-200 flex items-center"
          >
            <Book className="mr-1" /> README
          </button>
        )}
      </div>
    </div>
    <div className="p-4 bg-gray-100 dark:bg-gray-700">
      <button
        onClick={onVote}
        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        <ThumbsUp className="mr-2" /> Vote for {project.title}
      </button>
    </div>
  </div>
);

const markdownComponents: Components = {
  h1: ({ ...props }) => (
    <h1
      className="text-3xl font-bold mb-4 text-indigo-600 dark:text-indigo-300"
      {...props}
    />
  ),
  h2: ({ ...props }) => (
    <h2
      className="text-2xl font-semibold mb-3 text-indigo-500 dark:text-indigo-400"
      {...props}
    />
  ),
  h3: ({ ...props }) => (
    <h3
      className="text-xl font-semibold mb-2 text-indigo-400 dark:text-indigo-500"
      {...props}
    />
  ),
  p: ({ ...props }) => <p className="mb-4" {...props} />,
  a: ({ ...props }) => (
    <a
      className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
      {...props}
    />
  ),
  ul: ({ ...props }) => <ul className="list-disc pl-5 mb-4" {...props} />,
  ol: ({ ...props }) => <ol className="list-decimal pl-5 mb-4" {...props} />,
  li: ({ ...props }) => <li className="mb-1" {...props} />,
  img: ({ src, alt, ...props }) => (
    <div className="mb-4">
      <img
        src={src}
        alt={alt || ""}
        className="rounded-lg shadow-md"
        {...props}
      />
    </div>
  ),
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <pre className="bg-gray-100 dark:bg-gray-700 rounded p-4 overflow-x-auto">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    ) : (
      <code
        className="bg-gray-100 dark:bg-gray-700 rounded px-1 py-0.5"
        {...props}
      >
        {children}
      </code>
    );
  },
  blockquote: ({ ...props }) => (
    <blockquote
      className="border-l-4 border-indigo-500 pl-4 italic my-4"
      {...props}
    />
  ),
  table: ({ ...props }) => (
    <div className="overflow-x-auto mb-4">
      <table
        className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
        {...props}
      />
    </div>
  ),
  th: ({ ...props }) => (
    <th
      className="px-6 py-3 bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
      {...props}
    />
  ),
  td: ({ ...props }) => (
    <td
      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
      {...props}
    />
  ),
};


export default function Matchups() {
  const router = useRouter();
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Ships | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [readmeContent, setReadmeContent] = useState("");
  const [isReadmeView, setIsReadmeView] = useState(false);
  const [session, setSession] = useState<JwtPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchMatchup = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/battles/matchups");
      if (response.ok) {
        const data: Matchup = await response.json();
        setMatchup(data);
      } else {
        console.error("Failed to fetch matchup");
      }
    } catch (error) {
      console.error("Error fetching matchup:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeSession = async () => {
      const sessionData = await getSession();
      setSession(sessionData);
      
      if (sessionData === null) {
        router.push("/");
      } else {
        fetchMatchup();
      }
    };

    initializeSession();
  }, [router, fetchMatchup]);

  const handleVoteClick = (project: Ships) => {
    setSelectedProject(project);
    setReason("");
    setError("");
  };

  const handleVoteSubmit = async () => {
    if (reason.split(" ").length < 10) {
      setError("Please provide a reason with at least 10 words.");
      return;
    }
    if (selectedProject && matchup && session) {
      setIsSubmitting(true);
      try {
        const slackId = session.payload?.sub;
        const winner = selectedProject;
        const loser = selectedProject.id === matchup.project1.id ? matchup.project2 : matchup.project1;

        const response = await fetch("/api/battles/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slackId,
            explanation: reason,
            winner: winner.id,
            loser: loser.id,
            winnerRating: winner.rating,
            loserRating: loser.rating,
          }),
        });

        if (response.ok) {
          setSelectedProject(null);
          setReason("");
          fetchMatchup();
        } else {
          const errorData = await response.json();
          setError(`Failed to submit vote: ${errorData.error}`);
        }
      } catch (error) {
        console.error("Error submitting vote:", error);
        setError("An error occurred while submitting your vote. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleReadmeClick = async (project: Ships) => {
    try {
      const response = await fetch(project.readme_url);
      const content = await response.text();
      setReadmeContent(content);
      setIsReadmeView(true);
    } catch (error) {
      console.error("Error fetching README:", error);
    }
  };

  if (isReadmeView) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-black dark:text-white">
          <button
            onClick={() => setIsReadmeView(false)}
            className="mb-4 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center"
          >
            <ArrowLeft className="mr-2" /> Back to Matchup
          </button>
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown components={markdownComponents}>{readmeContent}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900 dark:to-indigo-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-indigo-600 dark:text-indigo-300 mb-4">
            Project Matchup
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-4 max-w-3xl mx-auto">
            A good project is technical, creative, and pushes the author out of their comfort zone. 
            By that definition, which of these two projects is better? (If you are not sure, just refresh to skip!)
          </p>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : !matchup ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <p className="text-2xl text-gray-600 dark:text-gray-300 mb-6">No matchup available</p>
            <button
              onClick={fetchMatchup}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-8 items-stretch mb-12">
              <div className="md:col-span-3">
                <ProjectCard
                  project={matchup.project1}
                  onVote={() => handleVoteClick(matchup.project1)}
                  onReadmeClick={() => handleReadmeClick(matchup.project1)}
                />
              </div>
              <div className="flex items-center justify-center text-6xl font-bold text-indigo-600 dark:text-indigo-300">
                VS
              </div>
              <div className="md:col-span-3">
                <ProjectCard
                  project={matchup.project2}
                  onVote={() => handleVoteClick(matchup.project2)}
                  onReadmeClick={() => handleReadmeClick(matchup.project2)}
                />
              </div>
            </div>
            {selectedProject && (
              <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-semibold text-indigo-600 dark:text-indigo-300 mb-4">
                  Why are you voting for {selectedProject.title} over the other?
                </h3>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide your reason here (minimum 10 words)"
                  className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-md mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-700 min-h-[150px]"
                  rows={6}
                />
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <button
                  onClick={handleVoteSubmit}
                  disabled={isSubmitting}
                  className={`bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-lg w-full sm:w-auto ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Vote"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}