/* eslint-disable @typescript-eslint/no-explicit-any */
import { authenticatedBaseQuery } from "@/redux/app/baseQueries";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface ChatMessage {
  message_id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "data";
  content: string;
  timestamp: string;
  tool_invocations: any[];
}

export interface ChatConversation {
  conversation_id: string;
  user_id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: authenticatedBaseQuery,
  tagTypes: ["Conversations"],
  endpoints: (builder) => ({
    getConversations: builder.query<ChatConversation[], { projectId: string }>({
      query: ({ projectId }) => ({
        url: `/chat/conversations?projectId=${projectId}`,
      }),
      providesTags: ["Conversations"],
    }),

    getConversation: builder.query<
      {
        conversation: ChatConversation;
        messages: ChatMessage[];
      },
      { conversationId: string; projectId: string }
    >({
      query: ({ conversationId, projectId }) => ({
        url: `/chat/conversations/${conversationId}?projectId=${projectId}`,
      }),
      providesTags: (result, error, { conversationId }) => [
        { type: "Conversations", id: conversationId },
      ],
    }),

    createConversation: builder.mutation<
      ChatConversation,
      { title: string; projectId: string }
    >({
      query: (body) => ({
        url: "/chat/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Conversations"],
    }),

    updateConversation: builder.mutation<
      void,
      { conversationId: string; title: string; projectId: string }
    >({
      query: ({ conversationId, title, projectId }) => ({
        url: `/chat/conversations/${conversationId}`,
        method: "PUT",
        body: { title, projectId },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: "Conversations", id: conversationId },
        "Conversations",
      ],
    }),

    deleteConversation: builder.mutation<
      void,
      { conversationId: string; projectId: string }
    >({
      query: ({ conversationId, projectId }) => ({
        url: `/chat/conversations/${conversationId}`,
        method: "DELETE",
        body: {
          projectId,
        },
      }),
      invalidatesTags: ["Conversations"],
    }),

    addMessage: builder.mutation<ChatMessage, Partial<ChatMessage>>({
      query: (message) => ({
        url: `/chat/conversations/${message.conversation_id}/messages`,
        method: "POST",
        body: {
          ...message,
        },
      }),
      invalidatesTags: (result, error, message) => [
        { type: "Conversations", id: message.conversation_id },
      ],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useAddMessageMutation,
} = chatApi;
